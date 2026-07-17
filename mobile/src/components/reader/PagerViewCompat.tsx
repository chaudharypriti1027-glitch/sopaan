import {
  Children,
  forwardRef,
  useImperativeHandle,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

export type PagerViewCompatHandle = {
  setPage: (index: number) => void;
  setPageWithoutAnimation?: (index: number) => void;
};

type PagerViewCompatProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  initialPage?: number;
  /** Accepted for API parity with react-native-pager-view; unused on web. */
  pageMargin?: number;
  onPageSelected?: (event: { nativeEvent: { position: number } }) => void;
};

/**
 * Web fallback for react-native-pager-view, which imports native-only modules
 * and breaks the whole web bundle. Renders the active page; page changes come
 * from the reader controls via setPage.
 */
const PagerViewCompat = forwardRef<PagerViewCompatHandle, PagerViewCompatProps>(
  function PagerViewCompat({ children, style, initialPage = 0, onPageSelected }, ref) {
    const [page, setPage] = useState(initialPage);

    useImperativeHandle(ref, () => {
      const jump = (index: number) => {
        setPage(index);
        onPageSelected?.({ nativeEvent: { position: index } });
      };
      return { setPage: jump, setPageWithoutAnimation: jump };
    });

    const items = Children.toArray(children);
    const active = items[Math.max(0, Math.min(page, items.length - 1))] ?? null;

    return <View style={[styles.root, style]}>{active}</View>;
  },
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
});

export default PagerViewCompat;
