export default class Graph {
    constructor(nodes, edges) {
        this.nodes = nodes;
        this.edges = edges;
    }

    // General graph methods

    /**
     * Gets the adjacency matrix representation of the graph
     * @returns {Array<Array<number>>} Adjacency matrix
     */
    getAdjacencyMatrix() {
        const nodeIds = this.nodes.getIds().sort((a, b) => a - b);
        const matrix = Array(nodeIds.length)
            .fill()
            .map(() => Array(nodeIds.length).fill(0));

        this.edges.forEach(edge => {
            const fromIndex = nodeIds.indexOf(edge.from);
            const toIndex = nodeIds.indexOf(edge.to);
            const weight = edge.label ? parseInt(edge.label) : 0;
            matrix[fromIndex][toIndex] = weight;
        });

        return matrix;
    }

    /**
     * Gets all neighbors of a node
     * @param {number|string} nodeId 
     * @returns {Array<number|string>} Array of neighbor IDs
     */
    getNeighbors(nodeId) {
        return this.edges
            .get()
            .filter(edge => edge.from === nodeId)
            .map(edge => edge.to);
    }

    /**
     * Checks if the graph is empty
     * @returns {boolean}
     */
    isEmpty() {
        return this.nodes.length === 0;
    }

    /**
     * Clears all nodes and edges
     */
    clear() {
        this.nodes.clear();
        this.edges.clear();
    }

    /**
     * Gets a node by ID
     * @param {number|string} id 
     * @returns {object|null} Node object or null if not found
     */
    getNode(id) {
        return this.nodes.get(id);
    }

    /**
     * Updates a node's properties
     * @param {number|string} id 
     * @param {object} properties 
     */
    updateNode(id, properties) {
        this.nodes.update({ id, ...properties });
    }

    /**
     * Removes a node and its connected edges
     * @param {number|string} id 
     */
    removeNode(id) {
        this.nodes.remove(id);
        this.edges.remove(this.edges.getIds().filter(edgeId => {
            const edge = this.edges.get(edgeId);
            return edge.from === id || edge.to === id;
        }));
    }

    /**
     * Gets the supply/demand value of a node
     * @param {number|string} id 
     * @returns {number} The value (0 if not set)
     */
    getSupplyDemandValue(id) {
        const node = this.getNode(id);
        return node?.value || 0;
    }

    /**
     * Sets the supply/demand value of a node
     * @param {number|string} id 
     * @param {number} value 
     */
    setSupplyDemandValue(id, value) {
        this.nodes.update({
            id,
            value: parseInt(value) || 0
        });
    }
}