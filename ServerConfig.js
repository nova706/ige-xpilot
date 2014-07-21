var igeConfig = {
    include: [
        {name: 'ServerNetworkEvents', path: './gameClasses/ServerNetworkEvents'},
        {name: 'Map1', path: './maps/map1'},
        {name: 'LandingPad', path: './gameClasses/LandingPad'},
        {name: 'Wall', path: './gameClasses/Wall'},
        {name: 'Box2DStreamEntity', path: './gameClasses/Box2DStreamEntity'},
        {name: 'Player', path: './gameClasses/Player'},
        {name: 'Bullet', path: './gameClasses/Bullet'},
        {name: 'Fuel', path: './gameClasses/Fuel'}
    ]
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = igeConfig;
}