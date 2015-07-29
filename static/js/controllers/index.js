/*global angular, $, url*/
angular.module('apiApp')
    .controller('index', function ($scope, Restangular, $location) {
        'use strict';
        $scope.users = [];
        $scope.regex = {
            'name': /^[a-zA-ZáÁéÉíÍóÓúÚñÑ\s]{3,}$/,
            'last_name': /^[a-zA-ZáÁéÉíÍóÓúÚñÑ\s]{3,}$/,
            'dni': /^(\d{8})(-?)([A-Za-z]{1})$/,
            'birth_date': /^(?:(?:31(\/)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/
        }; // regex

        /**
         * Function that check if the fields are valid.
         * If the fields are valid the user is created.
         */
        $scope.createUser = function (user, valid) {
            if (valid) {
                Restangular
                    .oneUrl('url', url)
                    .post('users/user', JSON.stringify(user)).then(function (response) {
                        $.notify({
                            title: '<strong>YEAH!</strong>',
                            message: 'Your user has been created correctly!'
                        }, {
                            animate: {
                                enter: 'animated fadeInDown',
                                exit: 'animated fadeOutUp'
                            },
                            placement: {
                                from: 'top',
                                align: 'center'
                            },
                            type: 'success'
                        }); // notify
                        $scope.users.push(angular.copy(user));
                    }, function (err) {
                        $.notify({
                            title: '<strong>WTF?</strong>',
                            message: 'Your user hasn\'t been created, something went wrong.'
                        }, {
                            animate: {
                                enter: 'animated fadeInDown',
                                exit: 'animated fadeOutUp'
                            },
                            placement: {
                                from: 'top',
                                align: 'center'
                            },
                            type: 'danger'
                        }); // notify
                    }); // err
            } else {
                $.notify({
                    title: '<strong>One moment!</strong>',
                    message: 'Don\'t be evil and fill the form.'
                }, {
                    animate: {
                        enter: 'animated fadeInDown',
                        exit: 'animated fadeOutUp'
                    },
                    placement: {
                        from: 'top',
                        align: 'center'
                    },
                    type: 'warning'
                }); // notify
            } // else
        }; // createUser

        /**
         * Function that reset the formulary values to empty.
         */
        $scope.clear = function () {
            $scope.user = {};
        }; // clear

        $scope.activeMenu = function (path) {
            if ($location.path().substr(0, $location.path().length) === path) {
                return 'active';
            } else {
                return '';
            } // else
        }; // activeMenu

        // Datepicker
        $scope.disabled = function (date, mode) {
            return (mode === 'day' && (date.getDay() === 0 || date.getDay() === 6));
        }; // disabled

        $scope.open = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.opened = true;
        }; // open

        $scope.dateOptions = {
            format: 'dd/MM/yyyy',
            startingDay: 1
        }; // dateOptions
    }); // index
