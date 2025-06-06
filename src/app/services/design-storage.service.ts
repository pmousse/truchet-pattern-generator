import { Injectable } from '@angular/core';
import { SavedDesign } from '../models/saved-design';

@Injectable({
    providedIn: 'root'
})
export class DesignStorageService {
    private readonly STORAGE_KEY = 'truchet_saved_designs';
    private nextId = 1;

    constructor() {
        // Initialize nextId based on existing designs
        const designs = this.getAllDesigns();
        if (designs.length > 0) {
            this.nextId = Math.max(...designs.map(d => d.id ?? 0)) + 1;
        }
    }

    private getDesigns(): SavedDesign[] {
        const designsJson = localStorage.getItem(this.STORAGE_KEY);
        return designsJson ? JSON.parse(designsJson) : [];
    }

    private saveDesigns(designs: SavedDesign[]): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(designs));
    }

    saveDesign(design: SavedDesign): SavedDesign {
        const designs = this.getDesigns();
        
        // If design has an ID, update existing design
        if (design.id !== undefined) {
            const index = designs.findIndex(d => d.id === design.id);
            if (index !== -1) {
                const updatedDesign = {
                    ...design,
                    // Keep the original creation date when updating
                    createdAt: designs[index].createdAt || new Date().toISOString()
                };
                designs[index] = updatedDesign;
                this.saveDesigns(designs);
                return updatedDesign;
            }
        }
        
        // If no ID or design not found, create new
        const newDesign = {
            ...design,
            id: this.nextId++,
            createdAt: new Date().toISOString() // Store as ISO string for consistent serialization
        };
        
        designs.push(newDesign);
        this.saveDesigns(designs);
        return newDesign;
    }

    getAllDesigns(): SavedDesign[] {
        return this.getDesigns();
    }

    getDesignById(id: number): SavedDesign | undefined {
        return this.getDesigns().find(d => d.id === id);
    }

    updateDesign(design: SavedDesign): boolean {
        if (!design.id) return false;

        const designs = this.getDesigns();
        const index = designs.findIndex(d => d.id === design.id);
        if (index === -1) return false;

        designs[index] = design;
        this.saveDesigns(designs);
        return true;
    }

    deleteDesign(id: number): void {
        const designs = this.getDesigns();
        const index = designs.findIndex(d => d.id === id);
        if (index !== -1) {
            designs.splice(index, 1);
            this.saveDesigns(designs);
        }
    }

    deleteAllDesigns(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}
