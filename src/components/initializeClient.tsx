// List of available Hive API nodes
const hiveNodes = [
    'https://api.hive.blog',
    'https://api.deathwing.me',
    'https://hive-api.arcange.eu',
    'https://api.openhive.network',
    'https://techcoderx.com',
    'https://api.c0ff33a.uk',
    'https://hive-api.3speak.tv',
    'https://hiveapi.actifit.io',
    'https://rpc.mahdiyari.info',
    'https://hive-api.dlux.io'
  ];
  
  // Function to check if a node is available
  async function checkNodeAvailability(url) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'condenser_api.get_version', params: [], id: 1 })
      });
  
      if (response.ok) {
        const data = await response.json();
        // console.log(`Node ${url} is available:`, data);
        return true;
      }
    } catch (error) {
      console.log(`Node ${url} is not available:`, error.message);
    }
    return false;
  }
  
  // Function to find the first available node
  async function getAvailableNode() {
    for (const node of hiveNodes) {
      const isAvailable = await checkNodeAvailability(node);
      if (isAvailable) {
        return node;
      }
    }
    throw new Error('No available Hive nodes found.');
  }
  
  // Function to initialize the client with an available node
  async function initializeClient() {
    try {
      const availableNode = await getAvailableNode();
      //console.log(`Available node found: ${availableNode}`);
      return availableNode; // Return the available node URL
    } catch (error) {
      console.error(error.message);
      return null; // Or handle accordingly if no nodes are available
    }
  }
  
  // Initialize the client
  export default initializeClient;
  