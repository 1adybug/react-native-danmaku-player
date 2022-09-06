import React, { memo, useEffect, useMemo, useRef, useState } from "react"
import { Animated, Easing, StyleProp, Text, View, ViewStyle } from "react-native"

export interface DanmakuItemRawData {
    content: string
    color: string
    timestamp: number
    id: number
}

export interface DanmakuItemShowData {
    content: string
    color: string
    left: number
    top: number
    lineHeight: number
    fontSize: number
    id: number
}

export interface GetDanmakuPositionConfig {
    data: DanmakuItemRawData[]
    startTimeStamp: number
    endTimeStamp: number
    width: number
    height: number
    lineHeight: number
    fontSize: number
}

export function getDanmakuPosition(config: GetDanmakuPositionConfig): DanmakuItemShowData[] {
    const { data, startTimeStamp, endTimeStamp, width, height, lineHeight, fontSize } = config
    const columnCount = Math.floor(height / lineHeight)
    const msWidth = width / (endTimeStamp - startTimeStamp)
    return data
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((value, index) => {
            const { content, color, timestamp, id } = value
            return {
                content: content,
                color: color,
                left: (timestamp - startTimeStamp) * msWidth,
                top: (index % columnCount) * lineHeight,
                lineHeight,
                fontSize,
                id
            }
        })
}

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
}

export function DanmakuPeriod(props: DanmakuPeriodProps) {
    const { data, startTimeStamp, endTimeStamp, lineHeight, fontSize, wrapperWidth, wrapperHeight, duration, paused } = props
    const period = endTimeStamp - startTimeStamp
    const speed = wrapperWidth / duration
    const width = speed * period
    const showList = useMemo(() => getDanmakuPosition({ startTimeStamp, endTimeStamp, data, width, height: wrapperHeight, fontSize, lineHeight }), [startTimeStamp, endTimeStamp, data, width, wrapperHeight, fontSize, lineHeight])
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
                    <Text key={id} style={{ position: "absolute", top, color, left, lineHeight, fontSize }}>
                        {content}
                    </Text>
                )
            })}
        </Animated.View>
    )
}

interface DanmakuAreaProps {
    width: number
    height: number
    period: number
    duration: number
    style: StyleProp<ViewStyle>
    fontSize: number
    lineHeight: number
    paused: boolean
    showPeriodDataList: { [period: number]: DanmakuItemRawData[] }
    currentPeriodCount: number
    random: number
}

const DanmakuArea = memo(function (props: DanmakuAreaProps) {
    const { style, width, height, showPeriodDataList, duration, period, currentPeriodCount, paused, random, fontSize, lineHeight } = props
    return (
        <View style={{ left: 0, top: 0, ...((style as any) || {}), width, height }}>
            {Object.keys(showPeriodDataList)
                .filter(key => {
                    const index = Number(key)
                    return index + (duration * 2) / period >= currentPeriodCount && index <= currentPeriodCount
                })
                .map(key => {
                    const index = Number(key)
                    return <DanmakuPeriod paused={paused} key={`${random}${key}`} wrapperWidth={width} duration={duration} startTimeStamp={index * period} endTimeStamp={(index + 1) * period} wrapperHeight={height} fontSize={fontSize} lineHeight={lineHeight} data={showPeriodDataList[index]} />
                })}
        </View>
    )
})

export interface DanmakuPlayerProps {
    width: number
    height: number
    period: number
    duration: number
    judge?: number
    ahead?: number
    style?: StyleProp<ViewStyle>
    fontSize: number
    lineHeight: number
    getDanmakuMethod: (startTimeStamp: number, endTimeStamp: number) => Promise<DanmakuItemRawData[]>
    paused: boolean
    currentTime: number
}

export default function DanmakuPlayer(props: DanmakuPlayerProps) {
    const { width, height, duration, period, style, judge, ahead, getDanmakuMethod, fontSize, lineHeight, paused, currentTime } = props

    const storageTime = useRef(currentTime)

    // 主要作用是是否重新渲染
    const [random, setRandom] = useState(Date.now())

    const [currentPeriodCount, setCurrentPeriodCount] = useState(-1)

    const [periodDataList, setPeriodDataList] = useState<{ [period: number]: DanmakuItemRawData[] }>({})

    const [showPeriodDataList, setShowPeriodDataList] = useState<{ [period: number]: DanmakuItemRawData[] }>({})

    const requestList = useRef<number[]>([])

    useEffect(() => {
        if (Math.abs(currentTime - storageTime.current) > (judge || 1000)) {
            setRandom(Date.now())
            setShowPeriodDataList({})
        }
        storageTime.current = currentTime
        const periodCount = Math.floor(currentTime / period)
        setCurrentPeriodCount(periodCount)
        for (let i = periodCount; i <= periodCount + (ahead || 1); i++) {
            if (!periodDataList[i] && !requestList.current.includes(i)) {
                requestList.current.push(i)
                getDanmakuMethod(i * period, (i + 1) * period)
                    .then(list => {
                        periodDataList[i] = list
                        setPeriodDataList({ ...periodDataList })
                    })
                    .catch(console.error)
            }
        }
        if (!showPeriodDataList[periodCount] && periodDataList[periodCount]) {
            showPeriodDataList[periodCount] = periodDataList[periodCount]
            setShowPeriodDataList({ ...showPeriodDataList })
        }
    }, [currentTime])

    return <DanmakuArea width={width} height={height} lineHeight={lineHeight} fontSize={fontSize} style={style} period={period} duration={duration} paused={paused} showPeriodDataList={showPeriodDataList} currentPeriodCount={currentPeriodCount} random={random} />
}
