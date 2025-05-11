export interface SavedDesign {
    id?: number;
    name: string;
    gridSize: number;
    pattern: string;
    tileRotations: number[];
    primaryColor: string;
    secondaryColor: string;
    createdAt?: Date;
    strokeWidth: number;
    tileSize: number;
    noiseScale: number;
    noiseFrequency: number;
    noiseOffset: {
        x: number;
        y: number;
    };
}
