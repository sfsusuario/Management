/**
 * JsonApi Service
 * Maneja las operaciones CRUD para la API JSON
 */
class JsonApi {
  constructor() {
    this.baseUrl = 'https://unidad.medicoslaboralessas.com/insecured/json';
    this.apiKey = 'external_api_key_123';
    this.clientId = 'crm_system';
  }

  /**
   * Obtiene los headers por defecto para las peticiones
   * @returns {Object} Headers de la petición
   */
  getDefaultHeaders() {
    return {
      'X-API-Key': this.apiKey,
      'X-Client-ID': this.clientId,
    };
  }

  /**
   * Obtiene los headers para peticiones con contenido JSON
   * @returns {Object} Headers con Content-Type
   */
  getJsonHeaders() {
    return {
      ...this.getDefaultHeaders(),
      'Content-Type': 'application/json',
    };
  }

  /**
   * Maneja errores de respuesta HTTP
   * @param {Response} response - Respuesta HTTP
   * @throws {Error} Error con mensaje descriptivo
   */
  async handleResponse(response) {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }
    
    // Verifica si la respuesta tiene contenido JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  }

  /**
   * Crea un nuevo registro
   * @param {string} recordId - ID del registro
   * @param {Object} data - Datos del registro
   * @returns {Promise<Object>} Respuesta de la API
   */
  async create(recordId, data = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/save/${recordId}`, {
        method: 'POST',
        headers: this.getJsonHeaders(),
        body: JSON.stringify(data),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error creating record:', error);
      throw error;
    }
  }

  /**
   * Lee un registro específico
   * @param {string} recordId - ID del registro
   * @returns {Promise<Object>} Datos del registro
   */
  async read(recordId) {
    try {
      const response = await fetch(`${this.baseUrl}/get/${recordId}`, {
        method: 'GET',
        headers: this.getDefaultHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error reading record:', error);
      throw error;
    }
  }

  /**
   * Actualiza un registro existente
   * @param {string} recordId - ID del registro
   * @param {Object} data - Datos actualizados
   * @returns {Promise<Object>} Respuesta de la API
   */
  async update(recordId, data = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/save/${recordId}`, {
        method: 'PUT',
        headers: this.getJsonHeaders(),
        body: JSON.stringify(data),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  }

  /**
   * Lista todos los registros
   * @returns {Promise<Array>} Lista de registros
   */
  async list() {
    try {
      const response = await fetch(`${this.baseUrl}/list`, {
        method: 'GET',
        headers: this.getDefaultHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error listing records:', error);
      throw error;
    }
  }

  /**
   * Elimina un registro
   * @param {string} recordId - ID del registro
   * @returns {Promise<Object>} Respuesta de la API
   */
  async delete(recordId) {
    try {
      const response = await fetch(`${this.baseUrl}/delete/${recordId}`, {
        method: 'DELETE',
        headers: this.getDefaultHeaders(),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }

  /**
   * Configura la URL base de la API
   * @param {string} url - Nueva URL base
   */
  setBaseUrl(url) {
    this.baseUrl = url;
  }

  /**
   * Configura la API Key
   * @param {string} key - Nueva API Key
   */
  setApiKey(key) {
    this.apiKey = key;
  }

  /**
   * Configura el Client ID
   * @param {string} id - Nuevo Client ID
   */
  setClientId(id) {
    this.clientId = id;
  }
}

// Exportar una instancia singleton
const jsonApi = new JsonApi();
export default jsonApi;

// También exportar la clase para casos donde se necesiten múltiples instancias
export { JsonApi };