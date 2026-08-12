import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

type PlaceGeo = {
  name: string;
  latitude?: number | null;
  longitude?: number | null;
};

function buildMapUrl(place: PlaceGeo): string {
  const { name, latitude, longitude } = place;
  const has =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);
  const q = encodeURIComponent(name);

  if (Platform.OS === 'ios') {
    if (has) {
      return `http://maps.apple.com/?ll=${latitude},${longitude}&q=${q}`;
    }
    return `http://maps.apple.com/?q=${q}`;
  }

  if (Platform.OS === 'android') {
    if (has) {
      return `geo:${latitude},${longitude}?q=${latitude},${longitude}(${q})`;
    }
    return `geo:0,0?q=${q}`;
  }

  // web / прочее — Google Maps
  if (has) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/** Открыть место во внешнем картографическом приложении (карта / навигатор). */
export async function openPlaceOnMap(place: PlaceGeo): Promise<void> {
  const url = buildMapUrl(place);
  await Linking.openURL(url);
}
