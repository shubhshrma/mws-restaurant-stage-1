let restaurant;
var newMap;

document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

window.addEventListener('load', () => {
  updateOnlineStatus = (event) => {
    DBHelper.updateOnlineStatus();
  }
  window.addEventListener('online',  updateOnlineStatus);
});

function submitReview() {
  event.preventDefault();
  let reviewData = getFormData();

  if (!navigator.onLine){
    const offlineReviews = DBHelper.setLocalStorage(JSON.stringify(reviewData));
    console.log("Offline review saved", reviewData);
  }
  else {
    DBHelper.addReviews(reviewData);
    console.log("Review uploaded: ", reviewData); 
  }
}

const submitButton = document.getElementById('submit-button');
 
 function getFormData() {
  const form = document.getElementById("reviews-form");
  let reviewerName = document.getElementById('reviewer-name').value;
  const comment = form.textarea.value;
  const ratings = document.querySelectorAll('input[type="radio"]');
  const restaurantId = window.location.href.split('=')[1];
  let rating = 0;
  let ratingId;
  for (var item of ratings) {
    if (item.checked == true) {
      ratingId = item.id;
      rating = item.value;
      item.checked = false;
      break;
    }
  }

  const body = {
    'restaurant_id': parseInt(restaurantId),
    'name': reviewerName,
    'rating': rating,
    'comments': comment,
    'createdAt': Date.now(),
    'updatedAt': Date.now()
  }

  form.textarea.value = '';
  document.getElementById('reviewer-name').value = '';

  const review = createReviewHTML(body);
  const ul = document.getElementById('reviews-list');
  ul.appendChild(review);
  return body;
};

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1Ijoic2h1YmhzaHJtYSIsImEiOiJjamlvanR4ZjMwb2Y2M3dud2R1NXc0MjJzIn0.OM0MXhOjouC6MMZUReOsfw',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}  
 
/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = DBHelper.imageAltForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  title.style.color = 'white';
  container.appendChild(title);

  const id = parseInt(getParameterByName('id'));

  const ul = document.getElementById('reviews-list');
  let getReviews = DBHelper.fetchReviewsById(id);
  //If network is found, update online status 
  if(navigator.onLine)
    DBHelper.updateOnlineStatus();

  let offlineReviews= DBHelper.getLocalDataByID('reviews', 'restaurant', id);
  offlineReviews.then((storedReviews) => {
  console.log('Data in offline reviews: ', storedReviews);
  storedReviews.reverse().forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
  })
    .catch((error) => {
      console.log('No reviews yet! ', error.message);
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild( noReviews);
    });
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  let dateObject = new Date(review.createdAt);
  date.innerHTML =`Date: ${dateObject.toDateString()}`;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}




