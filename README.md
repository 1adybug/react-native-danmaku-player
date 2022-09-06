# React-Native-Danmaku-Player

## 前言

一直以来，React Native 平台都没有什么好用的弹幕组件，要不早就停止更新，要不无法使用，而英文网络也没有使用弹幕的习惯，于是便撰写了这个组件

## 使用方法

- 使用 npm：

    ```shell
    npm i react-native-danmaku-player
    ```

- 使用 yarn：

    ```shell
    yarn add react-native-danmaku-player
    ```

## Props

```typescript
interface DanmakuItemRawData {
    content: string
    color: string
    timestamp: number
    id: number
}

interface DanmakuPlayerProps {
    width: number
    height: number
    period: number
    duration: number
    judge?: number
    ahead?: number
    style?: StyleProp<ViewStyle>
    fontSize: number
    lineHeight: number
    textShadowColor?: string
    textShadowRadius?: number
    paused: boolean
    currentTime: number
    getDanmakuMethod: (startTimeStamp: number, endTimeStamp: number) => Promise<DanmakuItemRawData[]>
}
```

组件中所有的时间单位都是毫秒 `ms`

- **width**

    必需，弹幕区域的宽度

- **height**

    必需，弹幕区域的高度

- **period**

    必需，弹幕的周期，单位毫秒。可以这么理解：如果设置成 10000，那么视频刚开播放时就会请求 0ms - 10000ms 之间的弹幕，并把这些弹幕渲染出来，向左移动，接着是 10000ms - 20000ms，依次类推。设置的数字较小的话，请求网络会比较频繁。

- **duration**

    必须，弹幕的从出现到消失的间隔，单位毫秒

- **judge**

    默认值 1000，单位毫秒。判断视频时间是否发生了激变，也就是用户是否操作了视频的进度条。此时因为时间线发生了变化，屏幕上的弹幕将会被清除，重新渲染当前时间进度的弹幕

- **ahead**

    默认值 1。可以这么理解当我们不可能在一个周期到来时，再去请求这个周期的弹幕，必须提前请求弹幕，渲染时可以直接使用数据。ahead 代表提前在第几个周期就请求当前周期的弹幕

- **style**

    相当于 `React Native` 中 `View` 组件的 `style` 属性

- **fontSize**

    必需，弹幕的字体大小

- **lineHeight**

    必需，弹幕的行高，建议设置为弹幕字体的 1.5 倍或者 2 倍

- **textShadowColor**

    弹幕描边颜色，默认无

- **textShadowRadius**

    弹幕描边半径，默认无

- **getDanmakuMethod**

    必需，用于获取弹幕数据的异步函数。将会传入两个参数，弹幕周期的起始的时间点和结束的时间点，必需返回弹幕原始数据数组 `DanmakuItemRawData[]`

- **paused**

    必须，弹幕是否暂停播放

- **currentTime**

    必须，当前的时间点，单位毫秒

## 用法

必需搭配 `react-native-video` 使用，建议使用 6.0.0-alpha.1 以上版本

```shell
# 截止目前为止，react-native-video 的最新稳定版本仍然是 5.2.0，如果在安装时已经在 6.0 以上版本，请自行去除安装命令末尾的 @next

yarn add react-native-video@next
```

如果你的项目使用 `TypeScript`，`react-native-video` 并没有自带类型声明，请手动安装类型声明。如果你使用的是 JavaScript，请忽视。

```shell
yarn add @types/react-native-video@next -D
```

**注意：`react-native-video` 中的时间单位均是秒，本插件使用的时间单位均是毫秒，因为毫秒是标准单位，请注意两者之间的换算！**

项目使用 Demo：

```tsx
import React, { useState } from "react"
import { View, Text, Image, Pressable, useWindowDimensions } from "react-native"
import DanmakuPlayer from "react-native-danmaku-player"
import Video from "react-native-video"

export default function App() {

    const { width, height } = useWindowDimensions()

    // 控制视频和弹幕一起播放和暂停
    const [paused, setPaused] = useState(false)

    // 当前的时间点，单位毫秒
    const [currentTime, setCurrentTime] = useState(0)

    const videoProcess = (onProgressData: OnProgressData) => {

        // 注意此时的单位换算
        setCurrentTime(onProgressData.currentTime * 1000)
    }

    return (
        <View style={{ width, height }}>
            <Video
                paused={paused}
                source={{ uri: AcFunVideoInfo.sourceList[2][0][0] }}
                style={{ width, height, backgroundColor: "black" }}
                onProgress={videoProcess} 
            />
            <DanmakuPlayer
                width={width}
                height={height}
                period={10000}
                duration={15000}
                fontSize={18}
                lineHeight={24}
                paused={paused}
                currentTime={currentTime}
                style={{ position: "absolute", left: 0, top: 0 }}
                // 在此传入你的异步函数，每个周期都会调用
                getDanmakuMethod={urMethod}
            />
        </View>
    )
}
```
