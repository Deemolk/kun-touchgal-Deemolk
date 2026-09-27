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
  const [openImage, setOpenImage] = useState<string | null>(null)
  const [images, setImages] = useState<
    { src: string; width: number; height: number }[]
  >([])
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

      setOpenImage(currentTarget.currentSrc || currentTarget.src)
    }

    const checkImageDimensions = (img: HTMLImageElement) => {
      if (shouldSkipLightbox(img)) {
        return
      }

      // 按原图尺寸筛掉表情等小图; 渲染尺寸随视口缩放, 手机上 16:9 截图高度不足 200
      const width = img.naturalWidth
      const height = img.naturalHeight
      const src = img.currentSrc || img.src

      if (width >= 200 && height >= 200) {
        setImages((prev) => {
          const exists = prev.some((image) => image.src === src)
          if (!exists) {
            return [...prev, { src, width, height }]
          }
          return prev
        })

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

  const currentImageIndex = openImage
    ? images.findIndex((img) => img.src === openImage)
    : -1
  const visibleImages =
    openImage && currentImageIndex < 0 ? [{ src: openImage }] : images

  if (!openImage) {
    return null
  }

  return (
    <KunImageLightbox
      index={Math.max(currentImageIndex, 0)}
      slides={visibleImages}
      open={true}
      onClose={() => setOpenImage(null)}
    />
  )
}
