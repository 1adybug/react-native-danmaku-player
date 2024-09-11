# React-Native-Danmaku-Player

## 前言

一直以来，React Native 平台都没有什么好用的弹幕组件，要不早就停止更新，要不无法使用，而英文网络也没有使用弹幕的习惯，于是便撰写了这个组件。

## 类型声明

<!-- 类型开始 -->
```TypeScript
import { ComponentProps } from "react";
import { StyleProp, TextStyle, View } from "react-native";

/** 弹幕原始数据 */
export interface DanmakuItemRawData {

    /** 文字内容 */
    content: string;

    /** 时间戳 */
    timestamp: number;

    /** 唯一标识 */
    id: number;
}

/** 弹幕展示的数据 */
export interface DanmakuItemShowData<T extends DanmakuItemRawData> {

    /** 弹幕原始数据 */
    data: T;

    /** 上边距 */
    top: number;

    /** 行高 */
    lineHeight: number;

    /** 字体大小 */
    fontSize: number;
}

/** 获取弹幕展示数据的配置 */
export interface GetDanmakuPositionConfig<T extends DanmakuItemRawData> {

    /** 弹幕的原始数据 */
    data: T[];

    /** 弹幕区域的高度 */
    height: number;

    /** 弹幕的行高 */
    lineHeight: number;

    /** 弹幕的字体大小 */
    fontSize: number;
}

/** 生成弹幕的位置 */
export declare function getDanmakuPosition<T extends DanmakuItemRawData>(config: GetDanmakuPositionConfig<T>): DanmakuItemShowData<T>[];

/** 用于获取弹幕数据的异步函数 */
export type DanmakuDataLoader<T extends DanmakuItemRawData> = (

/**
 * 弹幕周期的开始时间戳，单位毫秒
 */
startTimeStamp: number, 

/**
 * 弹幕周期的结束时间戳，单位毫秒
 */
endTimeStamp: number) => Promise<T[]>;

/** 设置弹幕的样式 */
export type GetDanmakuStyle<T extends DanmakuItemRawData> = (danmaku: T) => StyleProp<TextStyle>;

/** 弹幕播放器的基础配置 */
export type DanmakuPlayerBaseProps<T extends DanmakuItemRawData> = {

    /**
     * 弹幕的周期，单位毫秒。
     *
     * 可以这么理解：如果设置成 10000，那么视频刚开播放时就会请求 0ms - 10000ms 之间的弹幕，并把这些弹幕渲染出来，向左移动，接着是 10000ms - 20000ms，依次类推。设置的数字较小的话，请求网络会比较频繁。
     */
    period: number;

    /** 弹幕的从右侧到达左侧的间隔，单位毫秒 */
    lifetime: number;

    /** 视频的时长，单位毫秒 */
    duration: number;

    /**
     * 视频倍速
     *
     * @default 1
     */
    rate?: number;

    /**
     * 视频时间是否发生了激变，单位毫秒
     *
     * 也就是用户是否操作了视频的进度条。此时因为时间线发生了变化，弹幕的动画将会重新计算并开始
     *
     * @default 1000
     */
    threshold?: number;

    /** 用于获取弹幕数据的异步函数，函数接受两个参数，第一个参数是起始时间，第二个参数是结束时间，返回弹幕的原始数据 */
    loader: DanmakuDataLoader<T>;

    /**
     * 预加载周期数
     *
     * 比如当前周期为 5，预加载为 2，那么会加载 5、6、7 这 3 个周期的弹幕
     *
     * @default 1
     */
    preload?: number;

    /** 是否暂停播放 */
    paused: boolean;

    /** 当前的视频进度的时间戳，单位毫秒 */
    current: number;

    /** 弹幕字体大小 */
    fontSize: number;

    /** 弹幕的行高，建议设置为弹幕字体的 1.5 倍或者 2 倍 */
    lineHeight: number;

    /**
     * 弹幕样式
     *
     * 可以是一个样式对象，也可以是一个函数，函数的参数是弹幕的原始数据，返回值是一个样式对象
     */
    danmakuStyle?: StyleProp<TextStyle> | GetDanmakuStyle<T>;

    /**
     * 容器宽度
     */
    width: number;

    /**
     * 容器高度
     */
    height: number;
};

/** 弹幕播放器配置 */
export type DanmakuPlayerProps<T extends DanmakuItemRawData> = Omit<DanmakuPlayerBaseProps<T>, "width" | "height"> & Omit<ComponentProps<typeof View>, "children">;

/** 弹幕播放器底层 */
export declare function DanmakuPlayerBase<T extends DanmakuItemRawData>(props: DanmakuPlayerBaseProps<T>): import("react").JSX.Element;

/** 弹幕播放器 */
export default function DanmakuPlayer<T extends DanmakuItemRawData>(props: DanmakuPlayerProps<T>): import("react").JSX.Element;
```
<!-- 类型结束 -->

## 用法

建议搭配 `react-native-video` 使用

**注意：`react-native-video` 中的时间单位均是秒，本插件使用的时间单位均是毫秒，请注意两者之间的换算！**

项目使用 Demo：

```tsx
import { FC, useState } from "react"
import { useWindowDimensions, View } from "react-native"
import DanmakuPlayer from "react-native-danmaku-player"
import Video from "react-native-video"

const App: FC = () => {
    const { width, height } = useWindowDimensions()

    // 控制视频和弹幕一起播放和暂停
    const [paused, setPaused] = useState(false)

    // 当前的时间点，单位毫秒
    const [current, setCurrent] = useState(0)

    // 视频时长
    const [duration, setDuration] = useState(0)

    return (
        <View style={{ width, height }}>
            <Video
                paused={paused}
                source={{ uri: "your video source" }}
                style={{ width, height, backgroundColor: "black" }}
                onProgress={e => setCurrent(e.current * 1000)}
                onLoad={e => setDuration(e.duration * 1000)}
            />
            <DanmakuPlayer
                period={22000}
                lifetime={15000}
                fontSize={18}
                lineHeight={24}
                paused={paused}
                current={current}
                duration={duration}
                style={{ position: "absolute", left: 0, top: 0 }}
                // 在此传入你的异步函数，每个周期都会调用
                loader={(start: number, end: number) => getDanmaku(start, end)}
                danmakuStyle={item => ({ color: item.color })}
            />
        </View>
    )
}

export default App
```
