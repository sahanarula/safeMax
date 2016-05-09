// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'ion-google-place', 'starter.controllers', 'starter.services'])

.run(function($ionicPlatform, $rootScope) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // IO Scripts

      io.socket.on('user', function(data) {
        if (data.data.location && !data.data.event) return;
        if (data.data.event && data.data.event.type) {
          cordova.plugins.notification.local.schedule({
              id: 1,
              title: `${data.data.event.message}`,
              text: `${data.data.event.message}`,
              data: { data: data.data }
          });
        }
        else {
          cordova.plugins.notification.local.schedule({
            id: 1,
            title: `${data.previous.username} is travelling`,
            text: `${data.previous.username} is travelling`,
            data: { data: data.data }
          });
        }
        cordova.plugins.notification.local.on("click", function (data) {
          $rootScope.$broadcast(CLICKED_NOTIFICATION, data);
        });
      })


      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
      bluetoothSerial.isEnabled(function() {
        bluetoothSerial.connect('20:15:12:28:93:88', function(data){
          console.log('bluetooth device is ready');
          bluetoothSerial.subscribe('\n', function (data) {
            $rootScope.bluetoothData = data;
            data = data.replace(/(\r\n|\n|\r)/gm,"")
            data = data.replace(/\u0002(.*?)\u0002/g, "");
            if (data === '100' || data === '200') {
              navigator.notification.vibrate(100);
            }
            else {
              for (var i=0; i<2; i++) {
                navigator.notification.vibrate(300);
              }
            }
            $rootScope.$broadcast(UPDATE_BLUETOOTH_DATA, data);
          }, function(err) {
            console.log('data is not ready');
          });
        }, function(err) {
          console.log('Unable to connect to the bluetooth device');
        });
      }, function() {
        alert('Please turn on your bluetooth');
      });
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
  .state('tab', {
    url: '/tab',
    templateUrl: 'templates/tab-dash.html',
    controller: 'DashCtrl'
  })
  .state('guardian', {
    url: '/guardian',
    templateUrl: 'templates/guardian.html',
    controller: 'GuardianCtrl'
  })
  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'LoginCtrl'
  })
  .state('signup', {
    url: '/signup',
    templateUrl: 'templates/signup.html',
    controller: 'SignupCtrl'
  })
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');

});
