'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useMounted } from '~/hooks/useMounted'

// 只接管用户内容里的图片 (简介 / 评论 / 资源备注 / 评论预览, 均为 kun-prose-compact
// 容器), 头像、游戏卡片等界面图片不接管
const shouldSkipLightbox = (img: HTMLImageElement) => {
  return (
    !img.closest('.kun-prose-compact') ||
    Boolean(img.closest('[data-no-lightbox], .yarl__portal'))
  )
}

const KunImageLightbox = dynamic(
  () =>
    import('~/components/kun/image-viewer/ImageLightbox').then(
      (mod) => mod.KunImageLightbox
    ),
  { ssr: false }
)

export const KunAutoImageViewer = () => {
  const [lightbox, setLightbox] = useState<{
    slides: { src: string; width: number; height: number }[]
    index: number
  } | null>(null)
  const isMounted = useMounted()

  useEffect(() => {
    if (!isMounted) {
      return
    }

    const processedImages = new Set<HTMLImageElement>()

    const handleImageClick = (event: Event) => {
      const currentTarget = event.currentTarget
      if (!(currentTarget instanceof HTMLImageElement)) {
        return
      }

      // 点击时按文档顺序 (即页面上从左到右、从上到下) 取当前可见的图片; 按 load
      // 先后累积会被懒加载与网速打乱, 还会混入已卸载的和隐藏 tab 面板里的图片
      const targets = Array.from(document.querySelectorAll('img')).filter(
        (img) => processedImages.has(img) && img.getClientRects().length > 0
      )
      setLightbox({
        slides: targets.map((img) => ({
          src: img.currentSrc || img.src,
          width: img.naturalWidth,
          height: img.naturalHeight
        })),
        index: targets.indexOf(currentTarget)
      })
    }

    const checkImageDimensions = (img: HTMLImageElement) => {
      if (shouldSkipLightbox(img)) {
        return
      }

      // 按原图尺寸筛掉表情等小图; 渲染尺寸随视口缩放, 手机上 16:9 截图高度不足 200
      if (img.naturalWidth >= 200 && img.naturalHeight >= 200) {
        if (!processedImages.has(img)) {
          processedImages.add(img)
          img.style.cursor = 'pointer'
          img.addEventListener('click', handleImageClick)
        }
      }
    }

    const processImage = (img: HTMLImageElement) => {
      if (img.complete) {
        checkImageDimensions(img)
        return
      }

      img.addEventListener('load', () => checkImageDimensions(img), {
        once: true
      })
    }

    const collectImages = (node: Node) => {
      if (node instanceof HTMLImageElement) {
        return [node]
      }

      if (node instanceof Element) {
        return Array.from(node.querySelectorAll('img'))
      }

      return []
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          collectImages(node).forEach(processImage)
        })
      })
    })

    document.querySelectorAll('img').forEach((img) => {
      processImage(img)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => {
      observer.disconnect()
      processedImages.forEach((img) => {
        img.removeEventListener('click', handleImageClick)
      })
    }
  }, [isMounted])

  if (!lightbox) {
    return null
  }

  return (
    <KunImageLightbox
      index={lightbox.index}
      slides={lightbox.slides}
      open={true}
      onClose={() => setLightbox(null)}
    />
  )
}
