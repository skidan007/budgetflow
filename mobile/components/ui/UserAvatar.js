import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../../src/ThemeContext';

export const BUILT_IN_AVATARS = [
  { id: 'violet', skin: '#E8B99B', hair: '#392B3A', shirt: '#7657D5', bg: '#EDE7FF' },
  { id: 'ocean', skin: '#8B573F', hair: '#211D24', shirt: '#287A9C', bg: '#DDF3F6' },
  { id: 'coral', skin: '#F0C9A8', hair: '#A34C35', shirt: '#DE7068', bg: '#FFE8DF' },
  { id: 'sage', skin: '#C98E6B', hair: '#30251F', shirt: '#568875', bg: '#E1F0E5' },
  { id: 'gold', skin: '#F0C49B', hair: '#614229', shirt: '#D29A30', bg: '#FFF1D2' },
  { id: 'rose', skin: '#A96A53', hair: '#3C2835', shirt: '#B75F83', bg: '#F9E2EE' },
  { id: 'sky', skin: '#E6B994', hair: '#3D372F', shirt: '#517FCC', bg: '#E1EEFF' },
  { id: 'mint', skin: '#76503D', hair: '#17191D', shirt: '#38A38A', bg: '#DDF5EC' },
  { id: 'plum', skin: '#D9A487', hair: '#5A3748', shirt: '#945D88', bg: '#F1E4F2' },
  { id: 'stone', skin: '#E9BD9D', hair: '#4D514F', shirt: '#697983', bg: '#E8EEF0' },
];

export function AvatarIllustration({ avatarId, size = 40 }) {
  const avatar = BUILT_IN_AVATARS.find((item) => item.id === avatarId) || BUILT_IN_AVATARS[0];
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx="32" cy="32" r="32" fill={avatar.bg} />
      <Path d="M11 64c1-14 9-21 21-21s20 7 21 21" fill={avatar.shirt} />
      <Path d="M19 27c0-12 5-19 14-19 10 0 15 7 14 19l-2 12H21z" fill={avatar.hair} />
      <Circle cx="32" cy="31" r="13" fill={avatar.skin} />
      <Path d="M19 27c1-11 7-17 15-17 7 0 12 4 14 12-6 1-11-2-15-7-2 5-7 9-14 12" fill={avatar.hair} />
      <Circle cx="27" cy="31" r="1.2" fill="#352B2B" /><Circle cx="37" cy="31" r="1.2" fill="#352B2B" />
      <Path d="M28 37c2 2 6 2 8 0" fill="none" stroke="#9D5B55" strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

export function UserAvatar({ user, size = 40, style }) {
  const { colors } = useTheme();
  const [failedUri, setFailedUri] = useState('');
  const metadata = user?.user_metadata || {};
  const photo = metadata.custom_avatar_url;
  const googlePhoto = metadata.avatar_url || metadata.picture || user?.identities?.[0]?.identity_data?.avatar_url;
  const initials = String(metadata.full_name || metadata.name || user?.email?.split('@')[0] || 'U')
    .split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';
  const frame = [styles.frame, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.purpleTint, borderColor: colors.border }];
  return (
    <View style={[frame, style]} accessibilityLabel={`${initials} profile avatar`}>
      {photo && failedUri !== photo ? <Image source={{ uri: photo }} onError={() => setFailedUri(photo)} style={{ width: size, height: size, borderRadius: size / 2 }} resizeMode="cover" accessibilityLabel="Profile photo" />
        : metadata.selected_avatar_id ? <AvatarIllustration avatarId={metadata.selected_avatar_id} size={size} />
          : googlePhoto && failedUri !== googlePhoto ? <Image source={{ uri: googlePhoto }} onError={() => setFailedUri(googlePhoto)} style={{ width: size, height: size, borderRadius: size / 2 }} resizeMode="cover" accessibilityLabel="Google profile photo" />
            : <AvatarIllustration avatarId="violet" size={size} />}
      {!photo && !metadata.selected_avatar_id && !user && <Text style={[styles.initials, { color: colors.accentText }]}>{initials}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({ frame: { overflow: 'hidden', borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' }, initials: { position: 'absolute', fontSize: 12, fontWeight: '800' } });
