import React, { useEffect, useState } from "react";
import Papa from "papaparse";

// Crimes considered serious
const SERIOUS_CRIMES = [
  "HOMICIDE",
  "ROBBERY",
  "ASSAULT",
  "BATTERY",
  "CRIMINAL SEXUAL ASSAULT",
];

const CrimeData = () => {
  const [data, setData] = useState([]);
  const [areaSafety, setAreaSafety] = useState({});

  useEffect(() => {
    fetch("/crimes.csv") // Make sure this path is correct!
      .then((res) => res.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const crimeData = results.data;
console.log(crimeData)
            setData(crimeData);

            // Analyze safety by location
            const areaCount = {};
            crimeData.forEach((item) => {
              const type = item["Primary Type"];
              const location = item["Location Description"] || "UNKNOWN";

              if (SERIOUS_CRIMES.includes(type)) {
                areaCount[location] = (areaCount[location] || 0) + 1;
              }
            });

            const safetyMap = {};
            for (const location in areaCount) {
              safetyMap[location] = areaCount[location] > 5 ? "Unsafe" : "Safe";
            }

            setAreaSafety(safetyMap);
          },
        });
      });
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Nearby Crime Records</h2>
      {data.length === 0 ? (
        <p>Loading or no data found.</p>
      ) : (
        <ul style={{ textAlign: "left" }}>
          {data.slice(0, 20).map((item, index) => {
            const location = item["Location Description"];
            const safety = areaSafety[location] || "Unknown";

            return (
              <li key={index}>
                <strong>{item["Date"]}</strong> – {item["Primary Type"]} at{" "}
                {location} –{" "}
                <span style={{ color: safety === "Unsafe" ? "red" : "green" }}>
                  {safety}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default CrimeData;
