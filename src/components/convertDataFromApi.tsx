export async function convertDatafromApitoGeojson(data: any[]): Promise<any> {
    // Start the timer
    //const startTime = Date.now();

    // Transform the data into GeoJSON structure
    const transformedData = {
      type: "FeatureCollection",
      features: data.map((item) => ({
        type: "Feature",
        id: `${item.id}`,
        geometry: {
          type: "Point",
          coordinates: [item.longitude, item.lattitude],
        },
        properties: {
          name: `Location ${item.id}`,
        },
      })),
    };

    // End the timer
    // const endTime = Date.now();
    // const executionTime = (endTime - startTime) / 1000;

    // Output the execution time
    // console.log(`Data has been transformed`);
    // console.log(`Execution time: ${executionTime.toFixed(2)} seconds`);

    // Return the transformed data
    return transformedData;
  }