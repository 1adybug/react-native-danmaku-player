import { DanmakuItemRawData } from "../DanmakuPlayer"

/** 弹幕展示的数据 */
export interface DanmakuItemShowData<T extends DanmakuItemRawData> {
    /** 弹幕原始数据 */
    data: T
    /** 左边距 */
    left: number
    /** 上边距 */
    top: number
    /** 行高 */
    lineHeight: number
    /** 字体大小 */
    fontSize: number
}

export interface GetDanmakuPositionConfig<T extends DanmakuItemRawData> {
    /** 弹幕的原始数据 */
    data: T[]
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
export function getDanmakuPosition<T extends DanmakuItemRawData>(config: GetDanmakuPositionConfig<T>): DanmakuItemShowData<T>[] {
    const { data, startTimeStamp, endTimeStamp, width, height, lineHeight, fontSize } = config
    /** 弹幕区域的行数 */
    const columnCount = Math.floor(height / lineHeight)
    /** 每一毫秒的宽度 */
    const msWidth = width / (endTimeStamp - startTimeStamp)
    return data
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((item, index) => ({
            data: item,
            left: (item.timestamp - startTimeStamp) * msWidth,
            top: (index % columnCount) * lineHeight,
            lineHeight,
            fontSize
        }))
}
