import data from './bottle.json';

/**
 * 化学家语录漂流瓶
 */
export interface IBottle {
  /**
   * 语录作者
   */
  author: string;
  /**
   * 语录内容
   */
  content: string;
  /**
   * 语录解释
   */
  description: string;
}

export const Bottles = data as IBottle[];
