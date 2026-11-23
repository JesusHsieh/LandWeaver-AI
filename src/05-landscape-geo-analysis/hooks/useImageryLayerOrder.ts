import { useEffect } from 'react';
import type { ImageryProvider } from 'cesium';
import { waitForViewer } from '../transport/cesiumPrimitiveHelpers';

/**
 * Keeps transparent overlay layers above the opaque base maps.
 *
 * Imagery is drawn in collection order, and resium appends a layer whenever it
 * (re)creates one — so toggling OSM or switching its theme put the opaque base
 * map on top and hid every NLSC / regulatory overlay underneath it.
 * Base maps keep their relative order (last one switched on stays visible);
 * overlays are raised to the top in the given order.
 */
export function useImageryLayerOrder(
  viewerRef: React.RefObject<any>,
  overlaysBottomToTop: ImageryProvider[],
): void {
  useEffect(() => {
    let cancelled = false;
    let removeListener: (() => void) | undefined;

    waitForViewer(viewerRef).then(viewer => {
      if (cancelled) return;
      const layers = viewer.imageryLayers;

      const reorder = () => {
        for (const provider of overlaysBottomToTop) {
          for (let i = 0; i < layers.length; i++) {
            const layer = layers.get(i);
            if (layer.imageryProvider === provider) {
              if (i !== layers.length - 1) layers.raiseToTop(layer);
              break;
            }
          }
        }
      };

      reorder();
      // raiseToTop fires layerMoved, not layerAdded, so this cannot loop.
      removeListener = layers.layerAdded.addEventListener(reorder);
    });

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, [viewerRef, overlaysBottomToTop]);
}
