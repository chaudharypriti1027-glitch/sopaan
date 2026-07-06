import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlinkingEye, useAvatarBlink } from './BlinkingEye';

export type PersonHairStyle = 'crop' | 'wave' | 'bun' | 'spiky' | 'cap' | 'braid';

export type PersonAvatarSpec = {
  skin: readonly [string, string, string];
  hair: readonly [string, string, string];
  shirt: readonly [string, string, string];
  hairStyle: PersonHairStyle;
  cheek: string;
  iris?: string;
};

type PersonAvatarArtProps = {
  spec: PersonAvatarSpec;
  scene: readonly [string, string, string];
  size: number;
  /** Blinking eyes + micro life — profile, hero, picker preview. */
  live?: boolean;
};

/** Premium 3D person portrait — realistic face layers with depth shading. */
export function PersonAvatarArt({ spec, scene, size, live = false }: PersonAvatarArtProps) {
  const styles = useMemo(() => createStyles(size), [size]);
  const face = Math.round(size * 0.46);
  const hairH = Math.round(size * 0.22);
  const iris = spec.iris ?? '#5C4030';
  const blinkLid = useAvatarBlink(live);

  return (
    <View style={styles.canvas}>
      <LinearGradient colors={[...scene]} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={styles.scene} />
      <View style={styles.sceneGlow} />
      <View style={styles.vignette} />
      <View style={styles.depthEdge} />

      <LinearGradient
        colors={[...spec.shirt]}
        start={{ x: 0.25, y: 0 }}
        end={{ x: 0.75, y: 1 }}
        style={styles.shirt}
      >
        <View style={styles.shirtSheen} />
        <View style={styles.collar} />
        <View style={styles.collarRight} />
        <View style={styles.shoulderShadow} />
      </LinearGradient>

      <LinearGradient colors={[spec.skin[1], spec.skin[2]]} style={styles.neck} />

      <View style={[styles.facePlate, { width: face + 6, height: face + 8, borderRadius: (face + 6) * 0.34 }]}>
        <LinearGradient
          colors={[...spec.skin]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={[styles.face, { width: face, height: face, borderRadius: face * 0.36 }]}
        >
          <View style={styles.faceSheen} />
          <View style={styles.jawShadow} />
          <View style={[styles.cheek, styles.cheekLeft, { backgroundColor: spec.cheek }]} />
          <View style={[styles.cheek, styles.cheekRight, { backgroundColor: spec.cheek }]} />
          <View style={styles.noseShadow} />
          <View style={styles.browRow}>
            <View style={styles.brow} />
            <View style={styles.brow} />
          </View>
          <View style={styles.eyeRow}>
            <BlinkingEye size={size} iris={iris} lidColor={spec.skin[1]} live={live} lid={blinkLid} />
            <BlinkingEye size={size} iris={iris} lidColor={spec.skin[1]} live={live} lid={blinkLid} />
          </View>
          <LinearGradient
            colors={['#D88878', '#B86858']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.lips}
          />
        </LinearGradient>
      </View>

      <PersonHair spec={spec} size={size} face={face} hairH={hairH} styles={styles} />
      <View style={styles.floorShadow} />
    </View>
  );
}

function PersonHair({
  spec,
  size,
  face,
  hairH,
  styles,
}: {
  spec: PersonAvatarSpec;
  size: number;
  face: number;
  hairH: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const top = Math.round(size * 0.14);

  const hairGradient = (
    <LinearGradient
      colors={[spec.hair[0], spec.hair[1], spec.hair[2]]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={StyleSheet.absoluteFillObject}
    />
  );

  if (spec.hairStyle === 'cap') {
    return (
      <View style={[styles.hairWrap, { top, width: face + 10, height: hairH + 16 }]}>
        <View style={styles.capBrim}>{hairGradient}</View>
        <View style={styles.capTop}>{hairGradient}</View>
        <View style={styles.hairHighlight} />
      </View>
    );
  }

  if (spec.hairStyle === 'bun') {
    return (
      <View style={[styles.hairWrap, { top, width: face + 8, height: hairH + 20 }]}>
        <View style={styles.hairWave}>{hairGradient}</View>
        <View style={styles.bun}>{hairGradient}</View>
        <View style={styles.hairHighlight} />
      </View>
    );
  }

  if (spec.hairStyle === 'braid') {
    return (
      <View style={[styles.hairWrap, { top, width: face + 12, height: hairH + 22 }]}>
        <View style={styles.hairWaveLong}>{hairGradient}</View>
        <View style={styles.braidTail}>{hairGradient}</View>
        <View style={styles.hairHighlight} />
      </View>
    );
  }

  if (spec.hairStyle === 'spiky') {
    return (
      <View style={[styles.hairWrap, { top: top - 3, width: face + 6, height: hairH + 12 }]}>
        <View style={styles.hairSpiky}>{hairGradient}</View>
        <View style={[styles.spike, styles.spikeL]} />
        <View style={[styles.spike, styles.spikeC]} />
        <View style={[styles.spike, styles.spikeR]} />
      </View>
    );
  }

  if (spec.hairStyle === 'wave') {
    return (
      <View style={[styles.hairWrap, { top, width: face + 14, height: hairH + 18 }]}>
        <View style={styles.hairWaveLong}>{hairGradient}</View>
        <View style={styles.hairHighlight} />
      </View>
    );
  }

  return (
    <View style={[styles.hairWrap, { top, width: face + 6, height: hairH + 10 }]}>
      <View style={styles.hairCrop}>{hairGradient}</View>
      <View style={styles.hairHighlight} />
    </View>
  );
}

function createStyles(size: number) {
  const faceTop = Math.round(size * 0.2);

  return StyleSheet.create({
    canvas: {
      width: size,
      height: size,
      overflow: 'hidden',
      alignItems: 'center',
    },
    scene: {
      ...StyleSheet.absoluteFillObject,
    },
    sceneGlow: {
      position: 'absolute',
      top: -6,
      right: -4,
      width: size * 0.5,
      height: size * 0.5,
      borderRadius: size * 0.25,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    vignette: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '50%',
      backgroundColor: 'rgba(0,0,0,0.1)',
    },
    depthEdge: {
      position: 'absolute',
      top: 2,
      left: 2,
      bottom: 2,
      width: 2,
      backgroundColor: 'rgba(255,255,255,0.14)',
      zIndex: 1,
    },
    shirt: {
      position: 'absolute',
      left: Math.round(size * 0.1),
      right: Math.round(size * 0.1),
      bottom: -3,
      height: Math.round(size * 0.4),
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      overflow: 'hidden',
    },
    shirtSheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '35%',
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    shoulderShadow: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 8,
      backgroundColor: 'rgba(0,0,0,0.12)',
    },
    collar: {
      position: 'absolute',
      top: 7,
      left: '26%',
      width: 11,
      height: 15,
      backgroundColor: 'rgba(255,255,255,0.24)',
      transform: [{ rotate: '-20deg' }],
      borderRadius: 2,
    },
    collarRight: {
      position: 'absolute',
      top: 7,
      right: '26%',
      width: 11,
      height: 15,
      backgroundColor: 'rgba(255,255,255,0.24)',
      transform: [{ rotate: '20deg' }],
      borderRadius: 2,
    },
    neck: {
      position: 'absolute',
      top: faceTop + Math.round(size * 0.36),
      width: Math.round(size * 0.16),
      height: Math.round(size * 0.1),
      borderRadius: 4,
    },
    facePlate: {
      position: 'absolute',
      top: faceTop - 2,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
      ...StyleSheet.flatten({
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      }),
    },
    face: {
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.22)',
    },
    faceSheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '46%',
      backgroundColor: 'rgba(255,255,255,0.22)',
    },
    jawShadow: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '28%',
      backgroundColor: 'rgba(0,0,0,0.06)',
    },
    cheek: {
      position: 'absolute',
      width: 10,
      height: 6,
      borderRadius: 5,
      top: '54%',
      opacity: 0.5,
    },
    cheekLeft: { left: '14%' },
    cheekRight: { right: '14%' },
    noseShadow: {
      position: 'absolute',
      top: '48%',
      width: 4,
      height: 8,
      borderRadius: 2,
      backgroundColor: 'rgba(0,0,0,0.06)',
    },
    browRow: {
      position: 'absolute',
      top: '30%',
      flexDirection: 'row',
      gap: Math.round(size * 0.11),
    },
    brow: {
      width: Math.round(size * 0.065),
      height: 2.5,
      borderRadius: 1,
      backgroundColor: 'rgba(0,0,0,0.28)',
    },
    eyeRow: {
      flexDirection: 'row',
      gap: Math.round(size * 0.09),
      marginTop: Math.round(size * 0.055),
      zIndex: 3,
    },
    lips: {
      marginTop: Math.round(size * 0.02),
      width: Math.round(size * 0.12),
      height: Math.round(size * 0.035),
      borderRadius: 6,
      zIndex: 3,
    },
    hairWrap: {
      position: 'absolute',
      alignSelf: 'center',
      zIndex: 4,
      overflow: 'visible',
    },
    hairHighlight: {
      position: 'absolute',
      top: 4,
      left: '18%',
      width: '35%',
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255,255,255,0.18)',
    },
    hairCrop: {
      width: '100%',
      height: '100%',
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,
      overflow: 'hidden',
    },
    hairWave: {
      width: '94%',
      height: '74%',
      alignSelf: 'center',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 14,
      overflow: 'hidden',
    },
    hairWaveLong: {
      width: '100%',
      height: '90%',
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 8,
      overflow: 'hidden',
    },
    hairSpiky: {
      width: '100%',
      height: '80%',
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      overflow: 'hidden',
    },
    spike: {
      position: 'absolute',
      top: -5,
      width: 7,
      height: 12,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 2,
    },
    spikeL: { left: '20%', transform: [{ rotate: '-20deg' }] },
    spikeC: { left: '46%', height: 14 },
    spikeR: { right: '20%', transform: [{ rotate: '20deg' }] },
    bun: {
      position: 'absolute',
      top: -3,
      right: -3,
      width: 16,
      height: 16,
      borderRadius: 8,
      overflow: 'hidden',
    },
    braidTail: {
      position: 'absolute',
      right: -5,
      top: '36%',
      width: 9,
      height: 24,
      borderRadius: 4,
      overflow: 'hidden',
    },
    capBrim: {
      position: 'absolute',
      bottom: 2,
      left: -5,
      right: -5,
      height: 9,
      borderRadius: 4,
      overflow: 'hidden',
    },
    capTop: {
      width: '90%',
      height: '74%',
      alignSelf: 'center',
      borderTopLeftRadius: 11,
      borderTopRightRadius: 11,
      overflow: 'hidden',
    },
    floorShadow: {
      position: 'absolute',
      bottom: 5,
      width: '58%',
      height: 7,
      borderRadius: 4,
      backgroundColor: 'rgba(0,0,0,0.16)',
    },
  });
}
