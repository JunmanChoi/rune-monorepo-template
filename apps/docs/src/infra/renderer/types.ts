/************************* Render Options ************************ */

import type {
  LinkTagData,
  MetaTagData,
  OGTagData,
  ScriptData,
} from "@rune-ts/server";

export interface RenderOptions {
  title: string;
  description?: string;
  klass?: string;
  canonical_url?: string;
  meta_tags?: (MetaTagData & Record<string, string>)[];
  open_graph_tags?: OGTagData[];
  link_tags?: LinkTagData[];
  scripts?: ScriptData[];
}

export interface CommonRenderOptions extends RenderOptions {
  footer_hidden?: boolean;
  use_layout?: boolean;
}
