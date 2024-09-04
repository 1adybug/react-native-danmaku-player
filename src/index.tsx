import React, { memo, useEffect, useMemo, useRef, useState } from "react"
import { Animated, Easing, StyleProp, Text, View, ViewStyle } from "react-native"

/** 弹幕原始数据 */
export interface DanmakuItemRawData {
    /** 文字内容 */
    content: string
    /** 颜色 */
    color: string
    /** 时间戳 */
    timestamp: number
    /** 唯一标识 */
    id: number
}

/** 弹幕展示的数据 */
export interface DanmakuItemShowData {
    /** 文字内容 */
    content: string
    /** 左边距 */
    left: number
    /** 上边距 */
    top: number
    /** 行高 */
    lineHeight: number
    /** 字体大小 */
    fontSize: number
    /** 唯一标识 */
    id: number
}

export interface GetDanmakuPositionConfig {
    /** 弹幕的原始数据 */
    data: DanmakuItemRawData[]
    /** 弹幕周期的开始时间 */
    startTimeStamp: number
    /** 弹幕周期的结束时间 */
    endTimeStamp: number
    /** 弹幕区域的宽度 */
    width: number
    /** 弹幕区域的高度 */
    height: number
    /** 弹幕的行高 */
    lineHeight: number
    /** 弹幕的字体大小 */
    fontSize: number
}

/** 生成弹幕的位置 */
export function getDanmakuPosition(config: GetDanmakuPositionConfig): DanmakuItemShowData[] {
    const { data, startTimeStamp, endTimeStamp, width, height, lineHeight, fontSize } = config
    /** 弹幕区域的行数 */
    const columnCount = Math.floor(height / lineHeight)
    /** 每一毫秒的宽度 */
    const msWidth = width / (endTimeStamp - startTimeStamp)
    return data
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((value, index) => {
            const { content, color, timestamp, id } = value
            return {
                content,
                color,
                left: (timestamp - startTimeStamp) * msWidth,
                top: (index % columnCount) * lineHeight,
                lineHeight,
                fontSize,
                id
            }
        })
}

/** 弹幕周期 */
export interface DanmakuPeriodProps {
    data: DanmakuItemRawData[]
    startTimeStamp: number
    endTimeStamp: number
    lineHeight: number
    fontSize: number
    wrapperWidth: number
    wrapperHeight: number
    duration: number
    paused: boolean
    textShadowColor?: string
    textShadowRadius?: number
}

export function DanmakuPeriod(props: DanmakuPeriodProps) {
    const { data, startTimeStamp, endTimeStamp, lineHeight, fontSize, wrapperWidth, wrapperHeight, duration, paused, textShadowColor, textShadowRadius } = props
    /** 周期长度 */
    const period = endTimeStamp - startTimeStamp
    /** 弹幕速度 */
    const speed = wrapperWidth / duration
    /**  */
    const width = speed * period
    const showList = useMemo(
        () => getDanmakuPosition({ startTimeStamp, endTimeStamp, data, width, height: wrapperHeight, fontSize, lineHeight }),
        [startTimeStamp, endTimeStamp, data, width, wrapperHeight, fontSize, lineHeight]
    )
    const translateX = useRef(new Animated.Value(0)).current
    const animation = useRef(
        Animated.timing(translateX, {
            toValue: -2 * wrapperWidth,
            duration: duration * 2,
            useNativeDriver: true,
            easing: Easing.linear
        })
    ).current

    useEffect(() => {
        if (paused) {
            animation.stop()
        } else {
            animation.start()
        }
    }, [paused])

    return (
        <Animated.View style={{ position: "absolute", left: wrapperWidth, width, height: wrapperHeight, top: 0, transform: [{ translateX }] }}>
            {showList.map(value => {
                const { content, color, left, top, lineHeight, fontSize, id } = value
                return (
                    <Text key={id} style={{ position: "absolute", top, color, left, lineHeight, fontSize, textShadowColor, textShadowRadius }}>
                        {content}
                    </Text>
                )
            })}
        </Animated.View>
    )
}

interface DanmakuAreaProps extends Omit<DanmakuPlayerProps, "getDanmakuMethod" | "currentTime" | "threshold" | "judge" | "ahead"> {
    /** 已展示的周期的弹幕数据 */
    shownPeriodData: Record<number, DanmakuItemRawData[]>
    /** 当前的周期序号 */
    currentPeriod: number
    /** 当前的随机数 */
    random: number
}

const DanmakuArea = memo(function (props: DanmakuAreaProps) {
    const { style, width, height, shownPeriodData, duration, period, currentPeriod, paused, random, fontSize, lineHeight, textShadowColor, textShadowRadius } =
        props
    return (
        <View style={[{ left: 0, top: 0, width, height }, style]}>
            {Object.keys(shownPeriodData)
                .filter(key => {
                    const index = Number(key)
                    return index + (duration * 2) / period >= currentPeriod && index <= currentPeriod
                })
                .map(key => {
                    const index = Number(key)
                    return (
                        <DanmakuPeriod
                            paused={paused}
                            key={`${random}${key}`}
                            wrapperWidth={width}
                            duration={duration}
                            startTimeStamp={index * period}
                            endTimeStamp={(index + 1) * period}
                            wrapperHeight={height}
                            fontSize={fontSize}
                            lineHeight={lineHeight}
                            data={shownPeriodData[index]}
                            textShadowColor={textShadowColor}
                            textShadowRadius={textShadowRadius}
                        />
                    )
                })}
        </View>
    )
})

export interface DanmakuPlayerProps {
    /** 弹幕区域宽度 */
    width: number
    /** 弹幕区域高度 */
    height: number
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
    /**
     * 提前请求弹幕的周期数
     *
     * 我们不可能在一个周期到来时，再去请求这个周期的弹幕，必须提前请求弹幕，渲染时可以直接使用数据。
     *
     * @default 1
     */
    ahead?: number
    /** 播放器样式 */
    style?: StyleProp<ViewStyle>
    /** 弹幕字体大小 */
    fontSize: number
    /** 弹幕的行高，建议设置为弹幕字体的 1.5 倍或者 2 倍 */
    lineHeight: number
    /** 用于获取弹幕数据的异步函数 */
    getDanmakuMethod: (startTimeStamp: number, endTimeStamp: number) => Promise<DanmakuItemRawData[]>
    /** 是否暂停播放 */
    paused: boolean
    /** 当前的视频进度的时间戳，单位毫秒 */
    currentTime: number
    /** 弹幕描边颜色 */
    textShadowColor?: string
    /** 弹幕描边半径 */
    textShadowRadius?: number
}

export default function DanmakuPlayer(props: DanmakuPlayerProps) {
    const {
        width,
        height,
        period,
        duration,
        threshold = 1000,
        ahead = 1,
        style,
        fontSize,
        lineHeight,
        getDanmakuMethod,
        paused,
        currentTime,
        textShadowColor,
        textShadowRadius
    } = props

    const storageTime = useRef(currentTime)

    // 主要作用是是否重新渲染
    const [random, setRandom] = useState(Date.now())

    // 当前的周期
    const [currentPeriodIndex, setCurrentPeriodIndex] = useState(-1)

    // 缓存的周期的弹幕数据
    const { current: periodData } = useRef<Record<number, DanmakuItemRawData[]>>({})

    // 已经展示的周期的弹幕数据
    const [shownPeriodData, setShownPeriodData] = useState<Record<number, DanmakuItemRawData[]>>({})

    // 当前在请求的周期
    const { current: requestedIndexs } = useRef<Set<number>>(new Set())

    useEffect(() => {
        // 如果时间发生了激变
        if (Math.abs(currentTime - storageTime.current) > threshold) {
            setRandom(Date.now())
            setShownPeriodData({})
        }
        // 当前时间
        storageTime.current = currentTime
        /** 当前的周期 */
        const periodIndex = Math.floor(currentTime / period)
        setCurrentPeriodIndex(periodIndex)

        // 请求弹幕数据
        for (let i = periodIndex; i <= periodIndex + ahead; i++) {
            // 如果数据不存在，并且请求列表中没有这个周期的数据
            if (!periodData[i] && !requestedIndexs.has(i)) {
                requestedIndexs.has(i)
                getDanmakuMethod(i * period, (i + 1) * period)
                    .then(list => (periodData[i] = list))
                    .catch(error => {
                        console.error(error)
                        requestedIndexs.delete(i)
                    })
            }
        }

        // 如果这个周期的数据已经请求到了，但是没有展示
        if (!shownPeriodData[periodIndex] && periodData[periodIndex]) {
            shownPeriodData[periodIndex] = periodData[periodIndex]
            setShownPeriodData({ ...shownPeriodData })
        }
    }, [currentTime])

    return (
        <DanmakuArea
            width={width}
            height={height}
            period={period}
            duration={duration}
            style={style}
            fontSize={fontSize}
            lineHeight={lineHeight}
            paused={paused}
            shownPeriodData={shownPeriodData}
            currentPeriod={currentPeriodIndex}
            random={random}
            textShadowColor={textShadowColor}
            textShadowRadius={textShadowRadius}
        />
    )
}
