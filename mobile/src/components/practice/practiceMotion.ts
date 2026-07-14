import { FadeIn, FadeInDown, ReduceMotion } from 'react-native-reanimated';

export function practiceFadeInDown(index = 0, stepMs = 55, duration = 380) {
  return FadeInDown.duration(duration)
    .delay(index * stepMs)
    .reduceMotion(ReduceMotion.System);
}

export function practiceFadeIn(index = 0, stepMs = 45, duration = 300) {
  return FadeIn.duration(duration)
    .delay(index * stepMs)
    .reduceMotion(ReduceMotion.System);
}
