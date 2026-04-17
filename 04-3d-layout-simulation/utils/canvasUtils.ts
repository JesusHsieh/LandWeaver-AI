import React from 'react';
import { Point } from "../types";

export const getRelativeCoordinates = (
  event: React.MouseEvent<HTMLDivElement>,
  element: HTMLDivElement
): Point => {
  const rect = element.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  return { x, y };
};

/**
 * Draws the original image onto a canvas, then overlays the position marker and direction arrow.
 * Returns the base64 string of the combined result.
 */
export const generateAnnotatedImage = (
  imageSrc: string,
  marker: Point,
  angle: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.crossOrigin = "anonymous";
    img.src = imageSrc;

    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      if (!ctx) {
        reject("Could not get canvas context");
        return;
      }

      // 1. Draw original floor plan
      ctx.drawImage(img, 0, 0);

      // 2. Calculate actual pixel coordinates from percentages
      const px = (marker.x / 100) * canvas.width;
      const py = (marker.y / 100) * canvas.height;
      
      // Scale dimensions based on image size
      const baseSize = Math.max(canvas.width, canvas.height);
      const markerSize = baseSize * 0.015; 
      const viewDistance = baseSize * 0.25; 

      // Convert angle to radians for drawing
      // UI: 0 = Up (North), 90 = Right.
      // Canvas Math: 0 = Right, 90 = Down.
      // To convert UI Angle to Canvas Math Radians:
      // UI 0 -> -90 deg (Top)
      // UI 90 -> 0 deg (Right)
      // Formula: (angle - 90) * PI / 180
      const centerAngleRad = (angle - 90) * (Math.PI / 180);
      const fovRad = 60 * (Math.PI / 180); // 60 degree FOV

      // 3. Draw Field of View Cone (Faint background)
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.arc(px, py, viewDistance, centerAngleRad - fovRad / 2, centerAngleRad + fovRad / 2);
      ctx.lineTo(px, py);
      ctx.fillStyle = "rgba(255, 0, 0, 0.15)"; 
      ctx.fill();
      
      // Cone Edges
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(
        px + viewDistance * Math.cos(centerAngleRad - fovRad / 2),
        py + viewDistance * Math.sin(centerAngleRad - fovRad / 2)
      );
      ctx.moveTo(px, py);
      ctx.lineTo(
        px + viewDistance * Math.cos(centerAngleRad + fovRad / 2),
        py + viewDistance * Math.sin(centerAngleRad + fovRad / 2)
      );
      ctx.strokeStyle = "rgba(255, 0, 0, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 4. Draw CENTER DIRECTION LINE (Strong Red Arrow)
      // This is the critical cue for the AI
      const arrowLength = viewDistance * 0.9;
      const tipX = px + Math.cos(centerAngleRad) * arrowLength;
      const tipY = py + Math.sin(centerAngleRad) * arrowLength;

      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(tipX, tipY);
      ctx.strokeStyle = "red";
      ctx.lineWidth = markerSize * 0.6;
      ctx.stroke();

      // Draw Arrowhead at tip
      const headLen = markerSize * 2.5;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      // Left part of arrow head
      ctx.lineTo(
        tipX - headLen * Math.cos(centerAngleRad - Math.PI / 8),
        tipY - headLen * Math.sin(centerAngleRad - Math.PI / 8)
      );
      // Right part of arrow head
      ctx.lineTo(
        tipX - headLen * Math.cos(centerAngleRad + Math.PI / 8),
        tipY - headLen * Math.sin(centerAngleRad + Math.PI / 8)
      );
      ctx.closePath();
      ctx.fillStyle = "red";
      ctx.fill();

      // 5. Draw "LOOK THIS WAY" Text Label
      // CHANGE: We align the text WITH the arrow vector, so it reads like a street sign pointing the way.
      // This creates a strong "Line of Sight" vector for the AI.
      ctx.save();
      
      // Position slightly past the arrow tip
      const textDist = arrowLength + markerSize * 2;
      const textX = px + Math.cos(centerAngleRad) * textDist;
      const textY = py + Math.sin(centerAngleRad) * textDist;
      
      ctx.translate(textX, textY);
      
      // Rotate text to match the arrow angle.
      // We check if angle is 'backwards' (left side) to flip text so it's not upside down.
      let textRotation = centerAngleRad;
      if (Math.cos(centerAngleRad) < 0) {
         textRotation += Math.PI; // Flip 180 if pointing leftish
      }

      ctx.rotate(textRotation); 

      ctx.font = `bold ${Math.max(20, baseSize * 0.025)}px Arial, sans-serif`;
      ctx.fillStyle = "red";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      const labelText = ">>> LOOK THIS WAY >>>";

      // White outline for contrast
      ctx.lineWidth = 4;
      ctx.strokeStyle = "white";
      ctx.strokeText(labelText, 0, 0);
      ctx.fillText(labelText, 0, 0);
      ctx.restore();

      // 6. Draw Marker (Camera Position Dot)
      ctx.beginPath();
      ctx.arc(px, py, markerSize, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = markerSize * 0.3;
      ctx.stroke();

      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = (err) => reject(err);
  });
};