import React, { useEffect, useMemo, useRef, useState } from "react"
import { Animated, Easing, StyleProp, Text, View, ViewProps, ViewStyle } from "react-native"
import Video, { OnProgressData, VideoProperties } from "react-native-video"

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
}

export function DanmakuPeriod(props: DanmakuPeriodProps) {
    const { data, startTimeStamp, endTimeStamp, lineHeight, fontSize, wrapperWidth, wrapperHeight, duration } = props
    const period = endTimeStamp - startTimeStamp
    const speed = wrapperWidth / duration
    const width = speed * period
    const showList = useMemo(() => getDanmakuPosition({ startTimeStamp, endTimeStamp, data, width, height: wrapperHeight, fontSize, lineHeight }), [startTimeStamp, endTimeStamp, data, width, wrapperHeight, fontSize, lineHeight])
    const translateX = useRef(new Animated.Value(0)).current
    useEffect(() => {
        Animated.timing(translateX, {
            toValue: -2 * wrapperWidth,
            duration: duration * 2,
            useNativeDriver: true,
            easing: Easing.linear
        }).start()
    }, [])
    console.log(startTimeStamp)
    console.log(showList)
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

interface DanmakuProps {
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
}

interface DanmakuPlayerProps {
    wrapperProps: ViewProps
    danmakuProps: DanmakuProps
    videoProps: VideoProperties
}

export default function DanmakuPlayer(props: DanmakuPlayerProps) {
    const { wrapperProps, danmakuProps, videoProps } = props

    const { onProgress } = videoProps

    const { width, height, duration, period, style, judge, ahead, getDanmakuMethod, fontSize, lineHeight } = danmakuProps

    const currentTime = useRef(0)

    // 主要作用是是否重新渲染
    const [random, setRandom] = useState(Date.now())

    const [currentPeriodCount, setCurrentPeriodCount] = useState(-1)

    const [periodDataList, setPeriodDataList] = useState<{ [period: number]: DanmakuItemRawData[] }>({})

    const [showPeriodDataList, setShowPeriodDataList] = useState<{ [period: number]: DanmakuItemRawData[] }>({})

    const requestList = useRef<number[]>([])

    const videoProgress = (onProgressData: OnProgressData) => {
        const time = onProgressData.currentTime * 1000
        if (Math.abs(time - currentTime.current) > (judge || 1000)) {
            setRandom(Date.now())
            setShowPeriodDataList({})
        }
        currentTime.current = time
        const periodCount = Math.floor(time / period)
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
        onProgress && onProgress(onProgressData)
    }

    return (
        <View {...wrapperProps}>
            <Video {...videoProps} onProgress={videoProgress} />
            <View style={{ left: 0, top: 0, ...((style as any) || {}), width, height, position: "absolute" }}>
                {Object.keys(showPeriodDataList)
                    .filter(key => {
                        const index = Number(key)
                        return index + (duration * 2) / period >= currentPeriodCount && index <= currentPeriodCount
                    })
                    .map(key => {
                        const index = Number(key)
                        return <DanmakuPeriod key={`${random}${key}`} wrapperWidth={width} duration={duration} startTimeStamp={index * period} endTimeStamp={(index + 1) * period} wrapperHeight={height} fontSize={fontSize} lineHeight={lineHeight} data={showPeriodDataList[index]} />
                    })}
            </View>
        </View>
    )
}
