import { ComponentProps, useEffect, useMemo, useRef, useState } from "react"
import { Animated, Easing, LayoutChangeEvent, StyleProp, Text, TextStyle, View } from "react-native"

/** 弹幕原始数据 */
export interface DanmakuItemRawData {
    /** 文字内容 */
    content: string
    /** 时间戳 */
    timestamp: number
    /** 唯一标识 */
    id: number
}

/** 弹幕展示的数据 */
export interface DanmakuItemShowData<T extends DanmakuItemRawData> {
    /** 弹幕原始数据 */
    data: T
    /** 上边距 */
    top: number
    /** 行高 */
    lineHeight: number
    /** 字体大小 */
    fontSize: number
}

/** 获取弹幕展示数据的配置 */
export interface GetDanmakuPositionConfig<T extends DanmakuItemRawData> {
    /** 弹幕的原始数据 */
    data: T[]
    /** 弹幕区域的高度 */
    height: number
    /** 弹幕的行高 */
    lineHeight: number
    /** 弹幕的字体大小 */
    fontSize: number
}

/** 生成弹幕的位置 */
export function getDanmakuPosition<T extends DanmakuItemRawData>(config: GetDanmakuPositionConfig<T>): DanmakuItemShowData<T>[] {
    const { data, height, lineHeight, fontSize } = config
    /** 弹幕区域的行数 */
    const columnCount = Math.floor(height / lineHeight)

    return data
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((item, index) => ({
            data: item,
            top: (index % columnCount) * lineHeight,
            lineHeight,
            fontSize
        }))
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

/** 弹幕播放器的基础配置 */
export type DanmakuPlayerBaseProps<T extends DanmakuItemRawData> = {
    /**
     * 弹幕的周期，单位毫秒。
     *
     * 可以这么理解：如果设置成 10000，那么视频刚开播放时就会请求 0ms - 10000ms 之间的弹幕，并把这些弹幕渲染出来，向左移动，接着是 10000ms - 20000ms，依次类推。设置的数字较小的话，请求网络会比较频繁。
     */
    period: number

    /** 弹幕的从右侧到达左侧的间隔，单位毫秒 */
    lifetime: number

    /** 视频的时长，单位毫秒 */
    duration: number

    /**
     * 视频倍速
     *
     * @default 1
     */
    rate?: number

    /**
     * 视频时间是否发生了激变，单位毫秒
     *
     * 也就是用户是否操作了视频的进度条。此时因为时间线发生了变化，弹幕的动画将会重新计算并开始
     *
     * @default 1000
     */
    threshold?: number

    /** 用于获取弹幕数据的异步函数，函数接受两个参数，第一个参数是起始时间，第二个参数是结束时间，返回弹幕的原始数据 */
    loader: DanmakuDataLoader<T>

    /**
     * 预加载周期数
     *
     * 比如当前周期为 5，预加载为 2，那么会加载 5、6、7 这 3 个周期的弹幕
     *
     * @default 1
     */
    preload?: number

    /** 是否暂停播放 */
    paused: boolean

    /** 当前的视频进度的时间戳，单位毫秒 */
    current: number

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
    /**
     * 容器宽度
     */
    width: number
    /**
     * 容器高度
     */
    height: number
}

/** 弹幕播放器配置 */
export type DanmakuPlayerProps<T extends DanmakuItemRawData> = Omit<DanmakuPlayerBaseProps<T>, "width" | "height"> &
    Omit<ComponentProps<typeof View>, "children">

/** 弹幕播放器底层 */
export function DanmakuPlayerBase<T extends DanmakuItemRawData>(props: DanmakuPlayerBaseProps<T>) {
    const {
        period,
        lifetime,
        duration,
        rate = 1,
        threshold = 1000,
        loader,
        preload = 1,
        paused,
        current,
        fontSize,
        lineHeight,
        danmakuStyle,
        width,
        height,
        ...rest
    } = props
    const [now, setNow] = useState(() => Date.now())
    const [data, setData] = useState<DanmakuItemShowData<T>[]>([])
    const storageTime = useRef(current)
    const speed = -width / lifetime
    const translateX = useRef(new Animated.Value(speed * current)).current
    const unmount = useRef(false)
    const tasks = useRef<number[]>([]).current
    if (storageTime.current > current || current - storageTime.current > threshold) setNow(Date.now())
    storageTime.current = current

    const currentIndex = Math.floor(current / period)
    const startIndex = Math.max(Math.floor((current - lifetime) / period), 0)
    const endIndex = currentIndex + preload

    Array(endIndex - startIndex + 1)
        .fill(0)
        .forEach((item, index) => {
            const periodIndex = startIndex + index
            if (tasks.includes(periodIndex)) return
            tasks.push(periodIndex)
            loader(periodIndex * period, (periodIndex + 1) * period).then(response => {
                if (unmount.current) return
                const newData = getDanmakuPosition({
                    data: response,
                    height,
                    lineHeight,
                    fontSize
                })
                setData(data => [...data, ...newData])
            })
        })

    useEffect(() => {
        if (paused) return
        console.log(rate)
        const fromValue = speed * current
        translateX.setValue(fromValue)
        const toValue = speed * duration
        const animation = Animated.timing(translateX, {
            toValue,
            duration: (toValue - fromValue) / speed / rate,
            useNativeDriver: true,
            easing: Easing.linear
        })
        animation.start()
        return () => animation.stop()
    }, [paused, lifetime, speed, duration, now])

    return (
        <Animated.View style={{ position: "absolute", width, height, left: width, top: 0, transform: [{ translateX }] }}>
            {data
                .filter(({ data: { timestamp } }) => timestamp >= current - lifetime * 2 && timestamp <= current + lifetime * 2)
                .map(({ data, ...rest }) => (
                    <Text
                        key={data.id}
                        style={[
                            { position: "absolute", left: data.timestamp * -speed, ...rest },
                            typeof danmakuStyle === "function" ? danmakuStyle(data) : danmakuStyle
                        ]}
                    >
                        {data.content}
                    </Text>
                ))}
        </Animated.View>
    )
}

/** 弹幕播放器 */
export default function DanmakuPlayer<T extends DanmakuItemRawData>(props: DanmakuPlayerProps<T>) {
    const {
        period,
        lifetime,
        duration,
        rate = 1,
        threshold = 1000,
        loader,
        preload = 1,
        paused,
        current,
        fontSize,
        lineHeight,
        danmakuStyle,
        onLayout: _onLayout,
        ...rest
    } = props
    const [width, setWidth] = useState<number | undefined>(undefined)
    const [height, setHeight] = useState<number | undefined>(undefined)

    function onLayout(event: LayoutChangeEvent) {
        _onLayout?.(event)
        setWidth(event.nativeEvent.layout.width)
        setHeight(event.nativeEvent.layout.height)
    }

    const key = useMemo(() => Date.now(), [width, period, lifetime, duration, threshold])

    return (
        <View onLayout={onLayout} {...rest}>
            {!!width && !!height && (
                <DanmakuPlayerBase
                    key={key}
                    width={width}
                    height={height}
                    period={period}
                    lifetime={lifetime}
                    duration={duration}
                    rate={rate}
                    threshold={threshold}
                    loader={loader}
                    preload={preload}
                    paused={paused}
                    current={current}
                    fontSize={fontSize}
                    lineHeight={lineHeight}
                    danmakuStyle={danmakuStyle}
                />
            )}
        </View>
    )
}
