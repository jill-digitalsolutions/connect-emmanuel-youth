"use client";

import { FieldLabel, Select, FormRow } from "@/components/ui/FormField";
import type { ImageFit, TextAlign, TextPosition } from "@/lib/types/database.types";

export interface BannerLayout {
  image_fit: ImageFit;
  image_x: number;
  image_y: number;
  image_zoom: number;
  text_position: TextPosition;
  text_align: TextAlign;
}

export const DEFAULT_LAYOUT: BannerLayout = {
  image_fit: "contain",
  image_x: 50,
  image_y: 50,
  image_zoom: 100,
  text_position: "bottom",
  text_align: "left",
};

export function LayoutOptions({
  value,
  onChange,
}: {
  value: BannerLayout;
  onChange: (next: BannerLayout) => void;
}) {
  const set = <K extends keyof BannerLayout>(key: K, v: BannerLayout[K]) => onChange({ ...value, [key]: v });

  return (
    <>
      <FormRow>
        <div>
          <FieldLabel>Poster size</FieldLabel>
          <Select value={value.image_fit} onChange={(e) => set("image_fit", e.target.value as ImageFit)}>
            <option value="contain">Show the whole poster</option>
            <option value="cover">Fill the card (may crop)</option>
          </Select>
        </div>
      </FormRow>
      <Slider label="Move poster left ↔ right" value={value.image_x} min={0} max={100} onChange={(n) => set("image_x", n)} />
      <Slider label="Move poster up ↕ down" value={value.image_y} min={0} max={100} onChange={(n) => set("image_y", n)} />
      <Slider label="Zoom" value={value.image_zoom} min={100} max={300} onChange={(n) => set("image_zoom", n)} />
      <FormRow>
        <div>
          <FieldLabel>Text position</FieldLabel>
          <Select value={value.text_position} onChange={(e) => set("text_position", e.target.value as TextPosition)}>
            <option value="bottom">Bottom</option>
            <option value="center">Center</option>
            <option value="top">Top</option>
          </Select>
        </div>
        <div>
          <FieldLabel>Text alignment</FieldLabel>
          <Select value={value.text_align} onChange={(e) => set("text_align", e.target.value as TextAlign)}>
            <option value="left">Left</option>
            <option value="center">Centered</option>
            <option value="right">Right</option>
          </Select>
        </div>
      </FormRow>
    </>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <FieldLabel>
        {label} <span className="font-semibold opacity-70">({value}%)</span>
      </FieldLabel>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent-from"
      />
    </div>
  );
}
