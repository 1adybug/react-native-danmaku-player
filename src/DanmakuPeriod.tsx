import { useMemoizedFn, useRequest } from "ahooks"
import { useEffect, useMemo, useRef } from "react"
import { Animated, Easing, Text } from "react-native"
import { DanmakuItemRawData, DanmakuPlayerProps } from "./DanmakuPlayer"
import { getDanmakuPosition } from "./utils/getDanmakuPosition"

/** 弹幕周期 */
export interface DanmakuPeriodProps<T extends DanmakuItemRawData>
    extends Pick<DanmakuPlayerProps<T>, "loader" | "danmakuStyle" | "paused" | "duration" | "lineHeight" | "fontSize" | "currentTime"> {
    startTimeStamp: number
    endTimeStamp: number
    wrapperWidth: number
    wrapperHeight: number
    onEnd: () => void
}

export default function DanmakuPeriod<T extends DanmakuItemRawData>({
    currentTime,
    startTimeStamp,
    endTimeStamp,
    lineHeight,
    fontSize,
    wrapperWidth,
    wrapperHeight,
    duration,
    paused,
    loader,
    danmakuStyle,
    onEnd
}: DanmakuPeriodProps<T>) {
    // 弹幕数据
    const { data } = useRequest(() => loader(startTimeStamp, endTimeStamp))

    /** 周期时间长度 */
    const period = endTimeStamp - startTimeStamp

    /** 弹幕速度 */
    const speed = wrapperWidth / duration

    /** 弹幕周期的显示宽度 */
    const width = speed * period

    const _onEnd = useMemoizedFn(onEnd)

    const showList = useMemo(
        () => (data ? getDanmakuPosition({ startTimeStamp, endTimeStamp, data, width, height: wrapperHeight, fontSize, lineHeight }) : undefined),
        [startTimeStamp, endTimeStamp, data, width, wrapperHeight, fontSize, lineHeight]
    )

    const translateX = useRef(new Animated.Value(0)).current
    const animation = useRef(
        Animated.timing(translateX, {
            // 默认弹幕周期移动两个容器宽度后就消失
            toValue: -2 * wrapperWidth,
            duration: duration * 2,
            useNativeDriver: true,
            easing: Easing.linear
        })
    ).current

    useEffect(() => {
        if (paused) animation.stop()
        else animation.start(({ finished }) => finished && _onEnd())
    }, [paused])

    return (
        <Animated.View style={{ position: "absolute", left: wrapperWidth, width, height: wrapperHeight, top: 0, transform: [{ translateX }] }}>
            {showList?.map(value => {
                const { data, ...rest } = value
                return (
                    <Text key={data.id} style={[typeof danmakuStyle === "function" ? danmakuStyle(data) : danmakuStyle, { position: "absolute", ...rest }]}>
                        {data.content}
                    </Text>
                )
            })}
        </Animated.View>
    )
}
