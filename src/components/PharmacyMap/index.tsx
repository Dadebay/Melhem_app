import {memo, useMemo, useRef} from 'react';
import {Linking, Platform, Pressable, View} from 'react-native';
import {MapPin, Minus, Navigation, Plus} from 'lucide-react-native';
import {
  Camera,
  type CameraRef,
  Map as MapLibreMap,
  Marker,
} from '@maplibre/maplibre-react-native';
import useColors from '../../lib/hooks/useColors';
import {OSM_TILE_URL, OSM_TILE_SIZE, OSM_MAX_ZOOM} from '../../lib/config/map';

type LatLng = {latitude: number; longitude: number};

interface Props {
  /** The pharmacy's coordinate — both the camera target and the pin location. */
  center: LatLng;
  colors: ReturnType<typeof useColors>;
  /** Pharmacy name, used as the place label when opening external maps. */
  label?: string;
  height?: number;
  zoom?: number;
}

const MIN_ZOOM = 4;
const MAX_ZOOM = OSM_MAX_ZOOM;

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/**
 * Mini-map that drops a pin on the pharmacy's location. Pinch / double-tap and
 * the on-screen +/- buttons zoom the map; panning and rotation stay disabled so
 * the map never fights the vertical scroll of the list it lives in. A small
 * button opens the device's maps app for directions.
 */
const PharmacyMap = ({center, colors, label, height = 200, zoom = 15}: Props) => {
  const cameraRef = useRef<CameraRef>(null);
  // Tracked via the viewport-change event so pinch/double-tap keep the +/-
  // buttons in sync. Kept in a ref (not state) so changing it never re-renders
  // and re-applies the camera, which would fight the user's gestures.
  const zoomRef = useRef(zoom);

  // Same minimal self-hosted OSM raster style used by MapPicker.
  const mapStyle = useMemo(
    () =>
      JSON.stringify({
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [OSM_TILE_URL],
            tileSize: OSM_TILE_SIZE,
            maxzoom: OSM_MAX_ZOOM,
          },
        },
        layers: [{id: 'osm', type: 'raster', source: 'osm'}],
      }),
    [],
  );

  const zoomBy = (delta: number) => {
    const next = clamp(zoomRef.current + delta, MIN_ZOOM, MAX_ZOOM);
    zoomRef.current = next;
    cameraRef.current?.zoomTo(next, {duration: 200});
  };

  const openDirections = () => {
    const {latitude, longitude} = center;
    const coord = `${latitude},${longitude}`;
    const q = label ? encodeURIComponent(label) : coord;
    const url = Platform.select({
      ios: `https://maps.apple.com/?ll=${coord}&q=${q}`,
      android: `geo:${coord}?q=${coord}(${q})`,
    });
    if (url) Linking.openURL(url).catch(() => {});
  };

  const ctrlStyle = {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.$card,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.$border,
  };

  return (
    <View
      style={{
        height,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: colors.$surface,
      }}>
      <MapLibreMap
        style={{flex: 1}}
        mapStyle={mapStyle}
        // TextureView embeds smoothly inside a scrolling list (see MapPicker).
        androidView="texture"
        logo={false}
        attribution={false}
        compass={false}
        // Zoom is allowed (pinch / double-tap / one-finger), but panning and
        // rotation stay off so single-finger scrolling still belongs to the list.
        dragPan={false}
        touchZoom
        doubleTapZoom
        doubleTapHoldZoom
        touchRotate={false}
        touchPitch={false}
        onRegionDidChange={(event: any) => {
          const z = event?.nativeEvent?.zoom ?? event?.zoom;
          if (typeof z === 'number') zoomRef.current = z;
        }}>
        <Camera
          ref={cameraRef}
          center={[center.longitude, center.latitude]}
          zoom={zoom}
        />
        <Marker lngLat={[center.longitude, center.latitude]} anchor="bottom">
          <MapPin
            size={32}
            color={colors.$brandActive}
            fill={colors.$brandActive}
            strokeWidth={1.5}
          />
        </Marker>
      </MapLibreMap>

      {/* Overlay controls. `box-none` lets map gestures through everywhere
          except on the buttons themselves. */}
      <View
        pointerEvents="box-none"
        style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}>
        {/* Zoom +/- */}
        <View style={{position: 'absolute', right: 10, bottom: 10, gap: 8}}>
          <Pressable
            onPress={() => zoomBy(1)}
            hitSlop={6}
            accessibilityRole="button"
            style={ctrlStyle}>
            <Plus size={20} color={colors.$textPrimary} strokeWidth={2} />
          </Pressable>
          <Pressable
            onPress={() => zoomBy(-1)}
            hitSlop={6}
            accessibilityRole="button"
            style={ctrlStyle}>
            <Minus size={20} color={colors.$textPrimary} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Directions */}
        <Pressable
          onPress={openDirections}
          hitSlop={6}
          accessibilityRole="button"
          style={{...ctrlStyle, position: 'absolute', left: 10, bottom: 10}}>
          <Navigation size={18} color={colors.$brandActive} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
};

export default memo(PharmacyMap);
