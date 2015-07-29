/*global angular, $, url*/
angular.module('apiApp')
    .controller('users', function ($scope, Restangular, $location, $modal, $log) {
        'use strict';
        $scope.users = [];
        // Data by default
        $scope.currentPage = 0;
        $scope.itemsPerPage = 25;
        $scope.pagination = '25';
        $scope.searchText = null;

        $scope.$on('currentPage', function (event) {
            $scope.currentPage = event.targetScope.currentPage - 1;
            $scope.search();
        });

        $scope.$on('searchText', function (event) {
            $scope.searchText = event.targetScope.searchText;
            $scope.search();
        });

        $scope.$on('pagination', function (event) {
            $scope.pagination = event.targetScope.pagination;
            $scope.itemsPerPage = parseInt(event.targetScope.pagination, 10);
            $scope.search();
        });

        $.notify({
            message: '<div class="text-center"><strong><span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span> Loading...</strong></div>'
        }, {
            animate: {
                enter: 'animated fadeInDown',
                exit: 'animated fadeOutUp'
            },
            placement: {
                from: 'top',
                align: 'center'
            },
            delay: 0,
            type: 'info'
        }); // notify
        Restangular
            .oneUrl('url', url)
            .customGET('users', {page: 0, limit: 25}).then(function (users) {
                $.notifyClose();
                if (users.length === 0) {
                    $.notify({
                        title: '<strong>INFO!</strong>',
                        message: 'There are not exists users.'
                    }, {
                        animate: {
                            enter: 'animated fadeInDown',
                            exit: 'animated fadeOutUp'
                        },
                        placement: {
                            from: 'top',
                            align: 'center'
                        },
                        type: 'info'
                    }); // notify
                } else {
                    $scope.totalItems = users.shift(); // Número de elementos TOTAL de todas las páginas
                    angular.forEach(users, function (value) {
                        $scope.users.push(angular.copy(value));
                    });
                } // else
            }, function (err) {
                $.notifyClose();
                $.notify({
                    title: '<strong>ERROR!</strong>',
                    message: 'Something went wrong.'
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

        $scope.info = function (userIndex) {
            $scope.user = $scope.users[userIndex];
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'info.html',
                controller: 'info',
                size: 'lg',
                resolve: {
                    data: function () {
                        return {'user': $scope.user };
                    } // index
                } // resolve
            }); // $modal
        };

        $scope.update = function (userIndex) {
            $scope.user = $scope.users[userIndex];
            $scope.userIndex = userIndex;
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'update.html',
                controller: 'update',
                resolve: {
                    data: function () {
                        return {'user': $scope.user };
                    } // index
                } // resolve
            }); // $modal

            modalInstance.result.then(function (user) {
                $scope.users[$scope.userIndex] = user;
            }); // result
        }; // update

        $scope.remove = function (userIndex) {
            $scope.user = $scope.users[userIndex].username;
            $scope.userIndex = userIndex;
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'remove.html',
                controller: 'remove',
                resolve: {
                    data: function () {
                        return $scope.user;
                    } // index
                } // resolve
            }); // $modal

            modalInstance.result.then(function (deletedUser) {
                if (deletedUser === true) {
                    $scope.users.splice($scope.userIndex, 1);
                } // if
            }); // result
        }; // remove

        $scope.search = function () {
            if ($scope.pagination === '') {
                $.notify({
                    title: '<strong>WARNING!</strong>',
                    message: 'You should choose: 10, 25, 500 or 100.'
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
            } else {
                $scope.users = [];
                $.notify({
                    message: '<div class="text-center"><strong><span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span> Loading...</strong></div>'
                }, {
                    animate: {
                        enter: 'animated fadeInDown',
                        exit: 'animated fadeOutUp'
                    },
                    placement: {
                        from: 'top',
                        align: 'center'
                    },
                    delay: 0,
                    type: 'info'
                }); // notify
                Restangular
                    .oneUrl('url', url)
                    .customGET('users', {page: $scope.currentPage, limit: $scope.pagination, search: $scope.searchText}).then(function (users) {
                        $.notifyClose();
                        if (users.length === 0) {
                            $.notify({
                                title: '<strong>INFO!</strong>',
                                message: 'There are not exists users created. You should create an user: <a href="#/">link</a>.'
                            }, {
                                animate: {
                                    enter: 'animated fadeInDown',
                                    exit: 'animated fadeOutUp'
                                },
                                placement: {
                                    from: 'top',
                                    align: 'center'
                                },
                                type: 'info'
                            }); // notify
                        } else {
                            $scope.totalItems = users.shift(); // Número de elementos TOTAL de todas las páginas
                            angular.forEach(users, function (value) {
                                $scope.users.push(angular.copy(value));
                            });
                            $scope.itemsPerPage = $scope.pagination; // Número de elementos por página
                        } // else
                    }, function (err) {
                        $.notifyClose();
                        $.notify({
                            title: '<strong>ERROR!</strong>',
                            message: 'Something went wrong.'
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
            } // else
        }; // search

        $scope.activeMenu = function (path) {
            if ($location.path().substr(0, $location.path().length) === path) {
                return 'active';
            } else {
                return '';
            } // else
        }; // activeMenu
    }); // users

  angular.module('apiApp')
      .controller('info', function ($scope, Restangular, $modalInstance, data) {
          'use strict';
          $scope.user = data.user;
          $scope.cancel = function () {
              $modalInstance.dismiss('cancel');
          };
      }); // info

angular.module('apiApp')
    .controller('update', function ($scope, Restangular, $modalInstance, data) {
        'use strict';
        $scope.user = null;
        $scope.regex = {
            'name': /^[a-zA-ZáÁéÉíÍóÓúÚñÑ\s]{3,}$/,
            'last_name': /^[a-zA-ZáÁéÉíÍóÓúÚñÑ\s]{3,}$/,
            'dni': /^(\d{8})(-?)([A-Za-z]{1})$/,
            'birth_date': /^(?:(?:31(\/)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/
        }; // regex
        // Get the data user's are going to updated
        Restangular
            .oneUrl('url', url)
            .one('users', data.user.username)
            .get()
            .then(function (response) {
                $scope.user = response.plain();
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

        /**
         * Function that check if the fields are valid.
         * If the fields are valid the user is updated.
         */
        $scope.updateUser = function (valid) {
            if (valid) {
                Restangular
                    .oneUrl('url', url)
                    .one('users', $scope.user.username)
                    .customPUT(JSON.stringify($scope.user)).then(function () {
                        $modalInstance.close($scope.user);
                        $.notify({
                            title: '<strong>YEAH!</strong>',
                            message: 'Your user has been updated correctly!'
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
                    }, function (err) {
                        $.notify({
                            title: '<strong>WTF?</strong>',
                            message: 'Your user hasn\'t been updated, something went wrong.'
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
        }; // updateUser

        /**
         * Function that reset the formulary values to empty.
         */
        $scope.clear = function (user) {
            if (user !== undefined) {
                var field;
                for (field in user) {
                    if (user.hasOwnProperty(field)) {
                        user[field] = '';
                    } // if
                } // for
            } // if
        }; // clear

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }); // update

angular.module('apiApp')
    .controller('remove', function ($scope, Restangular, $modalInstance, data) {
        'use strict';
        $scope.username = data;
        $scope.ok = function () {
            Restangular
                .oneUrl('url', url)
                .one('users', $scope.username)
                .remove()
                .then(function (response) {
                    $.notify({
                        title: '<strong>YEAH!</strong>',
                        message: 'The user has been deleted.'
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
                    $modalInstance.close(true);
                }, function (err) {
                    $.notify({
                        title: '<strong>WTF?</strong>',
                        message: 'The user hasn\'t been deleted.'
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
        }; // ok

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        }; // cancel
    }); // remove
