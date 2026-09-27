'use client'

import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Download from 'yet-another-react-lightbox/plugins/download'
import 'yet-another-react-lightbox/styles.css'

interface Slide {
  src: string
  width?: number
  height?: number
}

interface Props {
  open: boolean
  slides: Slide[]
  index?: number
  onClose: () => void
}

export const KunImageLightbox = ({
  open,
  slides,
  index = 0,
  onClose
}: Props) => {
  // 单张图时 yarl 仍会渲染两个禁用态的前后翻页按钮
  const isSingleSlide = slides.length <= 1

  return (
    <Lightbox
      index={index}
      slides={slides}
      open={open}
      close={onClose}
      plugins={[Zoom, Download]}
      animation={{ fade: 300 }}
      // 图片尺寸勿用 imageProps 撑满 slide: 小图会被放大发糊, Zoom 上限失准,
      // 且 img 盖住留白使背景点击无法关闭; yarl 默认不超过原图, 放大交给 Zoom
      carousel={{
        finite: true,
        preload: 2
      }}
      render={{
        buttonPrev: isSingleSlide ? () => null : undefined,
        buttonNext: isSingleSlide ? () => null : undefined
      }}
      zoom={{
        maxZoomPixelRatio: 3,
        scrollToZoom: true
      }}
      controller={{
        closeOnBackdropClick: true
      }}
      styles={{ container: { backgroundColor: 'rgba(0, 0, 0, .7)' } }}
    />
  )
}
