/*global angular, $, $location*/

/* Controllers */
var apiApp = angular.module('apiApp', ['ui.bootstrap', 'restangular']);
var url = window.location.protocol + '//' + window.location.host; // API's url, Don't use localhost!! You use a domain name, for example: dev.localhost.

apiApp.controller('nav', function ($scope, $location) {
  $scope.activeMenu = function (path) {
      if (location.pathname === path) {
          return 'active';
      } else {
          return '';
      } // else
  }; // activeMenu
});
