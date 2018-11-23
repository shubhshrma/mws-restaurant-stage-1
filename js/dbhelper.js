/**
 * Common database helper functions.
 */
class DBHelper {

  static imageAlt(id) {
    let images_alt = {
      1: "Three rows of seating. Both rows other than the centre attached to walls having cuishioned sofa seats. Beautiful lighting environment with ambient yellow light.",
      2: "photograph of a pizza seeming really delicious!",
      3: "photograph of a beautiful interior of a restaurant consisting of wooden seating and in chair cooking facility.",
      4: "Street photo showing three people walking around the corner restaurant.",
      5: "Interior photo showing the counter and many people seated.",
      6: "photo showing a fairly populated place with square tables and families enjoying the meal.",
      7: "Exterior photo with two men passing by the shop and customers enjoying the food visible through the glass front.",
      8: "Photo of the banner outside the place with the Dutch written on it.",
      9: "Photo of some Asian people eating with a woman using her phone in the centre.",
      10: "Interior of the bar with white chairs and silver counter."
    }
    return images_alt[id];
  }

  static get DATABASE_URL() {
    const port = 1337 
    return `http://localhost:${port}/restaurants`;
  }

static openObjectStore  (db, storeName, transactionMode = 'readonly')  {
    return db.transaction(storeName, transactionMode).objectStore(storeName);
}

  static get openDatabase () {
    if (!navigator.serviceWorker) {
    return Promise.resolve();
   }
 
  if (!('indexedDB' in window)) {return null;}
  
  return idb.open('mws-restaurant-webapp', 1, (upgradeDb) =>  {
      switch(upgradeDb.oldVersion) {
        case 0:
          const store = upgradeDb.createObjectStore('restaurants', {
            keyPath: 'id'});
         
        case 1:
        const reviewsStore = upgradeDb.createObjectStore('reviews', {
          keyPath: 'id'});
        reviewsStore.createIndex('restaurant','restaurant_id');
        }

  });
};

static updateIndexedDB(id){
  
    const url = `http://localhost:1337/reviews/?restaurant_id=${id}`;
    let dbPromise = this.openDatabase;
  
    this.serverFetch(url,{
      credentials: 'include'
    })
      .then(reviews => {
        dbPromise
           .then((db) => {
               if (!db) return;

               const store = this.openObjectStore(db, 'reviews', 'readwrite');

               if (Array.isArray(reviews)){
                reviews.forEach(review => {
                  store.put(review);
                });

               }else {
                store.put(reviews);
               }
                console.log('Restaurant reviews added: ', reviews);
                return Promise.resolve(reviews);
           }); 
      })
      .catch((error) => {
        return this.getLocalDataByID('reviews', 'restaurant', id)
          .then((storedReviews) => {
          console.log('Looking for data in indexedDB: ');
          return Promise.resolve(storedReviews);
        });
          
      });
    
  }

  static addReviews(review){

    const headers = new Headers({'Content-Type': 'application/json'});
    const body = JSON.stringify(review);
    let options = {

      credentials: 'same-origin',
      mode: 'cors',
      cache: 'no-cache',
      method: 'POST',
      headers: headers,
      body: body
   
    };
    
    this.serverFetch(`http://localhost:1337/reviews/`, options)
      .then((data) => {
        console.log("Review added to server: ", data.restaurant_id);
        this.updateIndexedDB(data.restaurant_id);                   
      })
      .catch(error => console.log('Fail to add a review: ', error.message));
        
  }

static getLocalStorage() {
      const storedReviews = localStorage.getItem('offlineData');
      console.log("Offline reviews found: ", storedReviews);
      return storedReviews;
}
static setLocalStorage(offlineData) {
    const offlineReviews = localStorage.setItem('offlineData', offlineData);
    console.log("Offline reviews saved in localStorage: ", offlineReviews);
    return offlineReviews;
    
}

static updateOnlineStatus(){
  const  offlineData = JSON.parse(DBHelper.getLocalStorage());
  if (localStorage.length) {
    this.addReviews(offlineData);
    console.log('Data sent to server: ', offlineData);
    localStorage.clear();
  }

} 
 
 static fetchReviewsById(id){
    
    
    const url = `http://localhost:1337/reviews/?restaurant_id=${id}`;
    let dbPromise = this.openDatabase;
  
    this.serverFetch(url, {
      credentials: 'include'
    })
      .then(reviews => {
            dbPromise
               .then((db) => {
                   if (!db) return;

                   const store = this.openObjectStore(db, 'reviews', 'readwrite');

                   if (Array.isArray(reviews)){
                      reviews.forEach(review => {
                        store.put(review);
                   });

                   }else {
                      store.put(reviews);
                   }
                    console.log('Restaurant reviews added: ', reviews);
                    return Promise.resolve(reviews);
               }); 
      })
      .catch((error) => {
        return this.getLocalDataByID('reviews', 'restaurant', id)
                    .then((storedReviews) => {
                    console.log('Looking for local data in indexedDB: ');
                    return Promise.resolve(storedReviews);
              });
          
           
      });
    
  }    
  
 static serverFetch(url,options) {
    return fetch(url, options).then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.json();
    });
}

  static updateFavoriteStatus(restaurantID, isFav){
    console.log('Updated favorite status of restaurant id', restaurantID);
    const URL = `${this.DATABASE_URL}/${restaurantID}`;
   
    const isFavoriteData = {
        is_favorite: isFav
    };
     
    const headers = new Headers({'Content-Type': 'application/json'});
    const body = JSON.stringify(isFavoriteData);
    let options = {
      method: 'PUT',
      mode: 'cors',
      cache: "no-cache",
      credentials: 'same-origin',
      headers: headers,
      body: body
   
    };
    this.serverFetch(URL, options)
      .then(() => { 
         console.log("Favorite update succeeded")
      })
      .catch(error => console.log('Erro', error.message));

  }
  static getLocalDataByID(storeName, indexName, indexID){
    const dbPromise = this.openDatabase;
    let id = parseInt(indexID);
    return dbPromise.then((db) => {
          if (!db) return;
          const store = this.openObjectStore(db, storeName, 'readonly');
          const storeIndex = store.index(indexName);
          
          return Promise.resolve(storeIndex.getAll(id));
        });

  }

  static getLocalData(db_promise) {
    
    return db_promise.then((db) => {
      if (!db) return;
      const store = this.openObjectStore(db, 'restaurants', 'readonly');
      return store.getAll();
    });
  }

  static saveData(restaurantsJSON) {
    
    let restaurants = restaurantsJSON;
    console.log('restaurantsJSON ', restaurantsJSON);
    const dbPromise = this.openDatabase;

     dbPromise.then(db => {
     const store = this.openObjectStore(db, 'restaurants', 'readwrite');

       restaurants.forEach((restaurant) => {
        store.put(restaurant);
       })
     });
  }


static get getCachedMessages () {
   let dbPromise = this.openDatabase;
    return dbPromise.then(function (db) {

      if (!db) return;

      return DBHelper.openObjectStore(db, 'restaurants').getAll();

    })
  }


  static fetchRestaurants(callback) {
   const db_promise = this.openDatabase;
    const URL = this.DATABASE_URL;
    const option = {
    credentials: 'include'
    } 
     this.serverFetch(URL, option)
        .then(json => {
          const restaurants = json;
          this.saveData(restaurants);
          console.log('Request succeeded with JSON response', json);
          const rjson = { res: json };
          const res = JSON.parse(JSON.stringify(rjson)).res;
          console.log(res);
          callback(null, res);
        })
        .catch((error) => {
          const restaurantsDB = this.getLocalData(db_promise);
            restaurantsDB.then((restaurants) => {
              callback(null, restaurants);
            });
          console.log('There has been a problem with your fetch operation: ', error.message);
          
        });


  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Restaurant image alt text.
   */
  static imageAltForRestaurant(restaurant) {
    return (`${DBHelper.imageAlt(restaurant.photograph)}`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}

