export interface SnapshotMetadata {
  /** Snapshot identifier: "api_v1-gen_v3" */
  snapshotId: string;
  /** API version extracted from spec info.version */
  apiVersion: string;
  /** Auto-incremented generation number per API version */
  generation: number;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** Short alias for the snapshot, e.g. "gen4" or user-defined */
  alias: string;
  /** User-provided or default comment */
  comment: string;
  /** SHA-256 hash of the serialized OpenAPI spec */
  specHash: string;
  /** IR schema version — increment when IR structure changes */
  irVersion: number;
}
