export interface SavedDesign {
    id?: number;
    name: string;
    gridSize: {
        rows: number;
        cols: number;
    };
    pattern: string;
    tileRotations: number[];
    primaryColor: string;
    secondaryColor: string;
    createdAt?: string; // Store as ISO string for consistent serialization
    strokeWidth: number;
    tileSize: number;
    noiseScale: number;
    noiseFrequency: number;
    noiseOffset: {
        x: number;
        y: number;
    };
    thumbnail?: string; // Base64 encoded thumbnail image
}
