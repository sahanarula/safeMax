function showNotification (loading, message) {
  loading.show({
    template: message
  });

  setTimeout(function() {
    loading.hide();
  }, 3000)
}

getCurrentPositionName = function(scope, pos, callback) {
  scope.geocoder.geocode({ 'latLng': {lat: parseFloat(pos.latitude), lng: parseFloat(pos.longitude)} }, function (results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
          if (results[0]) {
              callback({ location: pos, address: results[0]});
          }
      }
  })
}

angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, $rootScope, $sce, $state, $ionicLoading) {

  $scope.geocoder = new google.maps.Geocoder();

  setInterval(function() {
    if ($rootScope.isLoggedin) {
      navigator.geolocation.getCurrentPosition(function(location) {
        console.log(location.coords);
        getCurrentPositionName($scope, location.coords, function(location) {
          io.socket.put(`${BASE_URL}/user/${$rootScope.user.id}`, {location: location.address.formatted_address}, function(data) {})
        })
      })
    }
  }, 2000)

  $rootScope.$on(CLICKED_NOTIFICATION, function(event, data) {
    var location = JSON.parse(data.data);
    if (location.data.path) {
      $scope.isPath = true;
      $scope.iframeMapUrl = $sce.trustAsResourceUrl(location.data.path);
      $scope.isIframeMapVisible = true;
    }
    else if(location.data.location) {
      $scope.isAlert = true;
      $scope.location = location.data.location;
      $scope.iframeMapUrl = $sce.trustAsResourceUrl(location.data.location);
      $scope.isIframeMapVisible = true;
    }
    $scope.$apply();
  })

  function sendDangerAlert() {
    $ionicLoading.show({
      template: 'Sending Alert Message'
    })
    navigator.geolocation.getCurrentPosition(function(location) {
      getCurrentPositionName($scope, location.coords, function(location) {
        io.socket.put(`${BASE_URL}/user/${$rootScope.user.id}`, {
          event: {
            type: 100,
            message: `${$rootScope.user.username} is in danger`
          },
          location: location.address.formatted_address
        }, function(data) {
          $ionicLoading.hide();
        })
      })
    })
  }

  function sendArrivalAlert () {
    $ionicLoading.show({
      template: 'Sending Arrival Message'
    })
    navigator.geolocation.getCurrentPosition(function(location) {
      getCurrentPositionName($scope, location.coords, function(location) {
        io.socket.put(`${BASE_URL}/user/${$rootScope.user.id}`, {
          event: {
            type: 200,
            message: `${$rootScope.user.username} has reached to the destination`
          },
          location: location.address.formatted_address
        }, function(data) {
          $ionicLoading.hide();
        })
      })
    })
  }

  $rootScope.$on(UPDATE_BLUETOOTH_DATA, function(event, data) {
    switch(data) {
      case '100':
        $scope.eventType = 100;
        break;
      case '200':
        $scope.eventType = 200;
        break;
      case 'init':
        $scope.eventType === 100 ? sendDangerAlert() : sendArrivalAlert();
    }
  })

  if (!$rootScope.isLoggedin) {
    $state.go('login')
  }

  $scope.sendPathToGuardian = function () {
    $ionicLoading.show({
      template: 'Sending Path to Guardian'
    })

    io.socket.put(`${BASE_URL}/user/${$rootScope.user.id}`, {path: $scope.iframeMap}, function(data) {
      $ionicLoading.hide();
    })
  }

  $rootScope.$on('UPDATED_PLACE_LOCATION', function(state, data) {
    if (data.type === 'start') {
      $scope.startLocation = data.location.formatted_address
    }
    if(data.type === 'end') {
      $scope.endLocation = data.location.formatted_address;
    }
    if ($scope.startLocation && $scope.endLocation) {
      $sce
      $scope.iframeMap = `https://www.google.com/maps/embed/v1/directions?key=AIzaSyAWh8m-TvGaPtaMGcNSeh_H3YfWKOMyJP8&origin=${$scope.startLocation}&destination=${$scope.endLocation}`
      console.log($scope.iframeMap);
      $scope.iframeMapUrl = $sce.trustAsResourceUrl($scope.iframeMap)
      console.log($scope.iframeMapUrl)
      $scope.isIframeMapVisible = true;
    }
  })
})

.controller('LoginCtrl', function($scope, $ionicLoading, $state, $rootScope) {
  $scope.data = {}
  $scope.isWard = false;
  $scope.$watch('data.type', function(newData, oldData) {
    if (newData === 'guardian') {
      $scope.isGuardian = true
      io.socket.get(`${BASE_URL}/user?type=ward`, function(data) {
        $scope.wards = data;
      })
    }
    else {
      $scope.isGuardian = false
    }
  })

  $scope.login = function() {
    $rootScope.ward = $scope.data.ward ? $scope.data.ward : null;
    $ionicLoading.show({
      template: 'Logging in'
    })
    io.socket.post(`${BASE_URL}/user/login`, $scope.data, function(data, headers) {
      $ionicLoading.hide();
      if (headers.statusCode === 400) {
        return showNotification($ionicLoading, `Something Went Wrong<br>${data.message}`);
      }
      $rootScope.user = data;
      $rootScope.isGuardian = data.type === 'guardian';
      $rootScope.isLoggedin = true;
      $rootScope.isGuardian ? $state.go('guardian') : $state.go('tab');
    })
  }
})

.controller('GuardianCtrl', function($scope, $ionicLoading, $state, $sce, $rootScope) {
  $scope.isIframeMapVisible = false;

  if (!$rootScope.isLoggedin) {
    $state.go('login')
  }

  $rootScope.$on(CLICKED_NOTIFICATION, function(event, data) {
    var location = JSON.parse(data.data);
    if (location.data.path) {
      $scope.isPath = true;
      $scope.iframeMapUrl = $sce.trustAsResourceUrl(location.data.path);
      $scope.isIframeMapVisible = true;
    }
    else if(location.data.location) {
      $scope.isAlert = true;
      $scope.location = location.data.location;
      $scope.iframeMap = `https://www.google.com/maps/embed/v1/place?key=AIzaSyAWh8m-TvGaPtaMGcNSeh_H3YfWKOMyJP8%20&q=${location.data.location}`;
      $scope.iframeMapUrl = $sce.trustAsResourceUrl($scope.iframeMap);
      $scope.isIframeMapVisible = true;
    }
    $scope.$apply();
  })

  $scope.fetchWardCurrentLocation = function() {
    $ionicLoading.show({
      template: 'Fetching Ward Location'
    })
    io.socket.get(`${BASE_URL}/fetchWardLocation?ward=${$rootScope.ward}`, function(data) {
      $ionicLoading.hide();
      $scope.iframeMap = `https://www.google.com/maps/embed/v1/place?key=AIzaSyAWh8m-TvGaPtaMGcNSeh_H3YfWKOMyJP8%20&q=${data.location}`;
      $scope.iframeMapUrl = $sce.trustAsResourceUrl($scope.iframeMap);
      $scope.isIframeMapVisible = true;
      $scope.$apply();
    })
  }

})

.controller('SignupCtrl', function($scope, $ionicLoading, $state) {
  $scope.data = {};
  $scope.signup = function() {
    io.socket.post(`${BASE_URL}/user/signup`, $scope.data, function(data) {
      showNotification($ionicLoading, `${data.type} saved successfully`);
      $state.go('login');
    })
  }
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
