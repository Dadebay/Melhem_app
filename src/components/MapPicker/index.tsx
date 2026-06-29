import {memo, useMemo} from 'react';
import {View} from 'react-native';
import {MapPin} from 'lucide-react-native';
import {Camera, Map as MapLibreMap} from '@maplibre/maplibre-react-native';
import useColors from '../../lib/hooks/useColors';
import {OSM_TILE_URL, OSM_TILE_SIZE, OSM_MAX_ZOOM} from '../../lib/config/map';

type LatLng = {latitude: number; longitude: number};

interface Props {
  /** Camera target. Changing it re-centers the map (e.g. on geolocation). */
  center: LatLng;
  /** Fires with the map center after the user pans/zooms. */
  onChange: (coordinate: LatLng) => void;
  colors: ReturnType<typeof useColors>;
  zoom?: number;
}

const MapPicker = ({center, onChange, colors, zoom = 15}: Props) => {
  // Minimal MapLibre style: a single self-hosted OSM raster source/layer.
  // `mapStyle` accepts a Style-JSON string, so no token/remote style needed.
  const mapStyle = useMemo(
    () =>
      JSON.stringify({
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [OSM_TILE_URL],
            tileSize: OSM_TILE_SIZE,
            // Server has no tiles above this zoom — let MapLibre upscale z18
            // instead of requesting 404s when the user zooms in further.
            maxzoom: OSM_MAX_ZOOM,
          },
        },
        layers: [{id: 'osm', type: 'raster', source: 'osm'}],
      }),
    [],
  );

  return (
    <View style={{flex: 1}}>
      <MapLibreMap
        style={{flex: 1}}
        mapStyle={mapStyle}
        // TextureView renders smoothly when the map is embedded inside a
        // ScrollView; the default SurfaceView stutters / fights the gesture.
        androidView="texture"
        logo={false}
        attribution={false}
        compass={false}
        touchRotate={false}
        touchPitch={false}
        onRegionDidChange={(event: any) => {
          const state = event?.nativeEvent;
          // Ignore programmatic moves (geolocation re-center) — only react to
          // the user dragging the map under the pin.
          if (!state?.userInteraction) return;
          const c = state.center; // LngLat tuple: [longitude, latitude]
          if (Array.isArray(c) && c.length >= 2) {
            onChange({latitude: c[1], longitude: c[0]});
          }
        }}>
        <Camera
          center={[center.longitude, center.latitude]}
          zoom={zoom}
          duration={300}
        />
      </MapLibreMap>

      {/* Fixed pin: its tip marks the exact map center the user is choosing. */}
      <View
        pointerEvents="none"
        style={{
          ...StyleSheetFill,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <MapPin
          size={32}
          color={colors.$brandActive}
          fill={colors.$brandActive}
          strokeWidth={1.5}
          // Lift by half the icon height so the point sits on the center.
          style={{transform: [{translateY: -16}]}}
        />
      </View>
    </View>
  );
};

const StyleSheetFill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export default memo(MapPicker);
