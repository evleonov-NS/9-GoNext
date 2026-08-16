import { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, useThemedStyles } from '@/components/ThemeContext';
import { radii, type AppColors } from '@/constants/theme';
import type { Photo } from '@/types';
import { isDisplayablePhotoUri } from '@/services/photos';

export type PhotoSource = 'library' | 'camera';

export function promptPhotoSource(onPick: (source: PhotoSource) => void) {
  Alert.alert('Добавить фото', 'Откуда взять изображение?', [
    { text: 'Галерея', onPress: () => onPick('library') },
    { text: 'Камера', onPress: () => onPick('camera') },
    { text: 'Отмена', style: 'cancel' },
  ]);
}

type Props = {
  photos: Photo[];
  onAdd: (source: PhotoSource) => void;
  onDelete: (photo: Photo) => void;
  busy?: boolean;
  addLabel?: string;
  /** false — только превью, кнопку добавления рисует родитель (как в прототипе). */
  showAddTile?: boolean;
};

export function PhotoGallery({
  photos,
  onAdd,
  onDelete,
  busy = false,
  addLabel = '+ Добавить фото',
  showAddTile = true,
}: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [viewer, setViewer] = useState<Photo | null>(null);
  const visible = photos.filter((p) => isDisplayablePhotoUri(p.uri));

  const chooseSource = () => {
    if (busy) return;
    promptPhotoSource(onAdd);
  };

  const confirmDelete = (photo: Photo) => {
    Alert.alert(
      'Удалить фото?',
      'Файл будет удалён с устройства вместе с записью.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            setViewer(null);
            onDelete(photo);
          },
        },
      ]
    );
  };

  if (visible.length === 0 && !showAddTile) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {visible.map((photo) => (
          <Pressable
            key={photo.id}
            style={styles.thumb}
            onPress={() => setViewer(photo)}
            onLongPress={() => confirmDelete(photo)}
          >
            <Image source={{ uri: photo.uri }} style={styles.thumbImg} />
          </Pressable>
        ))}
        {showAddTile ? (
          <Pressable
            style={[styles.addTile, busy && styles.disabled]}
            disabled={busy}
            onPress={chooseSource}
          >
            <Text style={styles.addTileText}>{addLabel}</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <Modal
        visible={viewer != null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewer(null)}
      >
        <View style={[styles.viewer, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
          {viewer ? (
            <Image source={{ uri: viewer.uri }} style={styles.full} resizeMode="contain" />
          ) : null}
          <View style={styles.viewerBar}>
            <Pressable style={styles.viewerBtn} onPress={() => setViewer(null)}>
              <Text style={styles.viewerBtnText}>Закрыть</Text>
            </Pressable>
            {viewer ? (
              <Pressable
                style={[styles.viewerBtn, styles.viewerDanger]}
                onPress={() => confirmDelete(viewer)}
              >
                <Text style={styles.viewerDangerText}>Удалить</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  wrap: {
    marginTop: 4,
  },
  row: {
    gap: 10,
    paddingVertical: 2,
  },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  addTile: {
    minWidth: 88,
    height: 88,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.dashed,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  addTileText: {
    fontWeight: '800',
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  viewer: {
    flex: 1,
    backgroundColor: 'rgba(20,22,20,0.94)',
    paddingHorizontal: 12,
  },
  full: {
    flex: 1,
    width: '100%',
  },
  viewerBar: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  viewerBtn: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  viewerBtnText: {
    fontWeight: '800',
    fontSize: 13,
    color: colors.text,
  },
  viewerDanger: {
    backgroundColor: colors.dangerBg,
  },
  viewerDangerText: {
    fontWeight: '800',
    fontSize: 13,
    color: colors.dangerText,
  },
  });
}
