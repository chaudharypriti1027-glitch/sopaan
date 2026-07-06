import { useCallback, useEffect, useMemo, useRef, type RefObject } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import RenderHTML, {
  type CustomBlockRenderer,
  type CustomTagRendererRecord,
  type TNode,
} from 'react-native-render-html';
import {
  READER_BASE_FONT_SIZE,
  READER_HORIZONTAL_MARGIN,
  READER_VERTICAL_MARGIN,
  type ReaderThemeTokens,
} from './readerTheme';

type ReaderPageContentProps = {
  html: string;
  theme: ReaderThemeTokens;
  fontScale: number;
  lineSpacing: number;
  pageOrder: number;
  bookId: string;
  focusLine?: number;
  readAloudLine?: number | null;
  readAloudCharIndex?: number;
  isHighlighted: (line: number) => boolean;
  onSelectLine: (line: number, text: string) => void;
  onLineLayout?: (line: number, y: number) => void;
  scrollRef?: RefObject<ScrollView | null>;
};

const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'li', 'blockquote']);

function collectText(node: TNode): string {
  if (node.type === 'text') {
    return node.data ?? '';
  }

  if (!node.children?.length) {
    return '';
  }

  return node.children.map(collectText).join(' ').replace(/\s+/g, ' ').trim();
}

export function ReaderPageContent({
  html,
  theme,
  fontScale,
  lineSpacing,
  pageOrder,
  bookId,
  focusLine,
  readAloudLine,
  readAloudCharIndex = 0,
  isHighlighted,
  onSelectLine,
  onLineLayout,
  scrollRef: externalScrollRef,
}: ReaderPageContentProps) {
  const { width } = useWindowDimensions();
  const lineCounter = useRef(0);
  const internalScrollRef = useRef<ScrollView>(null);
  const scrollRef = externalScrollRef ?? internalScrollRef;
  const lineOffsets = useRef<Record<number, number>>({});

  lineCounter.current = 0;

  useEffect(() => {
    if (readAloudLine == null) {
      return;
    }

    const y = lineOffsets.current[readAloudLine];
    if (typeof y === 'number') {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 48), animated: true });
    }
  }, [readAloudLine, readAloudCharIndex, scrollRef]);

  const contentWidth = width - READER_HORIZONTAL_MARGIN * 2;
  const fontSize = READER_BASE_FONT_SIZE * fontScale;

  const baseStyle = useMemo(
    () => ({
      color: theme.text,
      fontSize,
      lineHeight: Math.round(fontSize * lineSpacing),
      fontFamily: 'PlusJakartaSans_400Regular',
    }),
    [fontSize, lineSpacing, theme.text],
  );

  const tagsStyles = useMemo(
    () => ({
      body: {
        margin: 0,
        padding: 0,
      },
      p: {
        marginTop: 0,
        marginBottom: Math.round(fontSize * 0.75),
      },
      h1: {
        fontSize: fontSize * 1.35,
        lineHeight: Math.round(fontSize * 1.35 * lineSpacing),
        fontFamily: 'PlusJakartaSans_700Bold',
        marginBottom: Math.round(fontSize * 0.9),
      },
      h2: {
        fontSize: fontSize * 1.2,
        lineHeight: Math.round(fontSize * 1.2 * lineSpacing),
        fontFamily: 'PlusJakartaSans_700Bold',
        marginBottom: Math.round(fontSize * 0.75),
      },
      li: {
        marginBottom: Math.round(fontSize * 0.45),
      },
      blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: theme.accent,
        paddingLeft: 14,
        marginVertical: Math.round(fontSize * 0.5),
        opacity: 0.92,
      },
    }),
    [fontSize, lineSpacing, theme.accent],
  );

  const makeBlockRenderer = useCallback(
    (tagName: string): CustomBlockRenderer =>
      function BlockRenderer({ TDefaultRenderer, tnode, ...props }) {
        const line = lineCounter.current;
        if (BLOCK_TAGS.has(tagName)) {
          lineCounter.current += 1;
        }

        const text = collectText(tnode);
        const highlighted = isHighlighted(line);
        const focused = focusLine === line;
        const readAloudActive = readAloudLine === line;
        const readProgress =
          readAloudActive && text.length > 0
            ? Math.min(1, readAloudCharIndex / Math.max(text.length, 1))
            : 0;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={collectText(tnode) || `Line ${line}`}
            onLongPress={() => onSelectLine(line, text)}
            delayLongPress={380}
            onLayout={(event) => {
              lineOffsets.current[line] = event.nativeEvent.layout.y;
              onLineLayout?.(line, event.nativeEvent.layout.y);
            }}
            style={({ pressed }) => [
              styles.block,
              highlighted && { backgroundColor: theme.highlight },
              readAloudActive && styles.readAloudActive,
              focused && styles.focused,
              pressed && styles.blockPressed,
            ]}
          >
            <TDefaultRenderer tnode={tnode} {...props} />
            {readAloudActive ? (
              <View style={[styles.readAloudUnderline, { width: `${readProgress * 100}%` }]} />
            ) : null}
          </Pressable>
        );
      },
    [focusLine, isHighlighted, onLineLayout, onSelectLine, readAloudCharIndex, readAloudLine, theme.highlight],
  );

  const renderers = useMemo<CustomTagRendererRecord>(
    () => ({
      p: makeBlockRenderer('p'),
      h1: makeBlockRenderer('h1'),
      h2: makeBlockRenderer('h2'),
      h3: makeBlockRenderer('h3'),
      h4: makeBlockRenderer('h4'),
      li: makeBlockRenderer('li'),
      blockquote: makeBlockRenderer('blockquote'),
    }),
    [makeBlockRenderer],
  );

  const source = useMemo(() => ({ html: html || '<p></p>' }), [html]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      accessibilityRole="scrollbar"
      accessibilityLabel={`Page ${pageOrder}`}
      key={`${bookId}-${pageOrder}-${fontScale}-${lineSpacing}-${theme.id}`}
    >
      <RenderHTML
        contentWidth={contentWidth}
        source={source}
        baseStyle={baseStyle}
        tagsStyles={tagsStyles}
        renderers={renderers}
        defaultTextProps={{
          selectable: false,
          maxFontSizeMultiplier: 2,
        }}
        systemFonts={[
          'PlusJakartaSans_400Regular',
          'PlusJakartaSans_600SemiBold',
          'PlusJakartaSans_700Bold',
        ]}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: READER_HORIZONTAL_MARGIN,
    paddingVertical: READER_VERTICAL_MARGIN,
  },
  block: {
    borderRadius: 8,
    paddingHorizontal: 4,
    marginHorizontal: -4,
  },
  blockPressed: {
    opacity: 0.92,
  },
  focused: {
    borderLeftWidth: 3,
    borderLeftColor: '#C29A4E',
    paddingLeft: 8,
  },
  readAloudActive: {
    backgroundColor: 'rgba(95,138,123,0.16)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(194,154,78,0.55)',
  },
  readAloudUnderline: {
    height: 2,
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: '#C29A4E',
  },
});
