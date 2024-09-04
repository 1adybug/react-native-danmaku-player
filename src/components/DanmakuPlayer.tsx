import { ComponentProps, Fragment, useRef, useState } from "react"
import { LayoutChangeEvent, StyleProp, TextStyle, View } from "react-native"
import DanmakuPeriod from "./DanmakuPeriod"

/** 弹幕原始数据 */
export interface DanmakuItemRawData {
    /** 文字内容 */
    content: string
    /** 时间戳 */
    timestamp: number
    /** 唯一标识 */
    id: number
}

/** 用于获取弹幕数据的异步函数 */
export type DanmakuDataLoader<T extends DanmakuItemRawData> = (
    /**
     * 弹幕周期的开始时间戳，单位毫秒
     */
    startTimeStamp: number,
    /**
     * 弹幕周期的结束时间戳，单位毫秒
     */
    endTimeStamp: number
) => Promise<T[]>

/** 设置弹幕的样式 */
export type GetDanmakuStyle<T extends DanmakuItemRawData> = (danmaku: T) => StyleProp<TextStyle>

export interface DanmakuPlayerProps<T extends DanmakuItemRawData> extends Omit<ComponentProps<typeof View>, "children"> {
    /**
     * 弹幕的周期，单位毫秒。
     *
     * 可以这么理解：如果设置成 10000，那么视频刚开播放时就会请求 0ms - 10000ms 之间的弹幕，并把这些弹幕渲染出来，向左移动，接着是 10000ms - 20000ms，依次类推。设置的数字较小的话，请求网络会比较频繁。
     */
    period: number

    /** 弹幕的从右侧到达左侧的间隔，单位毫秒 */
    duration: number

    /**
     * 视频时间是否发生了激变，单位毫秒
     *
     * 也就是用户是否操作了视频的进度条。此时因为时间线发生了变化，屏幕上的弹幕将会被清除，重新渲染当前时间进度的弹幕
     *
     * @default 1000
     */
    threshold?: number

    /** 用于获取弹幕数据的异步函数 */
    loader: DanmakuDataLoader<T>

    /** 预加载周期数 */
    preload?: number

    /** 是否暂停播放 */
    paused: boolean

    /** 当前的视频进度的时间戳，单位毫秒 */
    currentTime: number

    /** 弹幕字体大小 */
    fontSize: number

    /** 弹幕的行高，建议设置为弹幕字体的 1.5 倍或者 2 倍 */
    lineHeight: number

    /**
     * 弹幕样式
     *
     * 可以是一个样式对象，也可以是一个函数，函数的参数是弹幕的原始数据，返回值是一个样式对象
     */
    danmakuStyle?: StyleProp<TextStyle> | GetDanmakuStyle<T>
}

export default function DanmakuPlayer<T extends DanmakuItemRawData>({
    period,
    duration,
    threshold = 1000,
    loader,
    preload = 0,
    paused,
    currentTime,
    fontSize,
    lineHeight,
    danmakuStyle,
    onLayout,
    ...rest
}: DanmakuPlayerProps<T>) {
    const [width, setWidth] = useState<number | undefined>(undefined)
    const [height, setHeight] = useState<number | undefined>(undefined)
    const [periodIndexs, setPeriodIndexs] = useState(() => new Set<number>())
    const [key, setKey] = useState(Date.now())
    const storageTime = useRef(currentTime)

    if (storageTime.current > currentTime || currentTime - storageTime.current > threshold) {
        setPeriodIndexs(new Set<number>())
        setKey(Date.now())
    }

    storageTime.current = currentTime

    function _onLayout(event: LayoutChangeEvent) {
        onLayout?.(event)
        setWidth(event.nativeEvent.layout.width)
        setHeight(event.nativeEvent.layout.height)
    }

    const currentPeriodIndex = Math.floor(currentTime / period)

    const periodIndexsToLoad = Array(preload + 1).map((item, index) => currentPeriodIndex + index)

    if (periodIndexsToLoad.some(item => !periodIndexs.has(item))) {
        const newPeriods = new Set([...periodIndexs, ...periodIndexsToLoad])
        setPeriodIndexs(newPeriods)
    }

    function removePeriodIndex(removeIndex: number) {
        const newPeriods = new Set(periodIndexs)
        newPeriods.delete(removeIndex)
        setPeriodIndexs(newPeriods)
    }

    return (
        <View onLayout={_onLayout} {...rest}>
            <Fragment key={key}>
                {width &&
                    height &&
                    Array.from(periodIndexs).map(periodIndex => (
                        <DanmakuPeriod<T>
                            key={periodIndex}
                            currentTime={currentTime}
                            startTimeStamp={periodIndex * period}
                            endTimeStamp={(periodIndex + 1) * period}
                            lineHeight={lineHeight}
                            fontSize={fontSize}
                            wrapperWidth={width}
                            wrapperHeight={height}
                            duration={duration}
                            paused={paused}
                            loader={loader}
                            danmakuStyle={danmakuStyle}
                            onEnd={() => removePeriodIndex(periodIndex)}
                        />
                    ))}
            </Fragment>
        </View>
    )
}
