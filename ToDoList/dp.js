const dbPromise = idb.open("TodoDB", 2, (upgradeDB) => {

  if (!upgradeDB.objectStoreNames.contains("tasks")) {

    upgradeDB.createObjectStore("tasks", {

      keyPath: "id",
      autoIncrement: true

    });

  }

});