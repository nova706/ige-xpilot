var igeClientConfig = {
    include: [
        /* Your custom game JS scripts */
        './gameClasses/ClientNetworkEvents.js',
        './gameClasses/SceneGenerator.js',
        './gameClasses/MapGenerator.js',
        './gameClasses/ContactListener.js',

        './components/TouchControllerComponent.js',

        './maps/map1.js',
        './gameClasses/Box2DStreamEntity.js',
        './gameClasses/Player.js',
        './gameClasses/PlayerControlBehavior.js',
        './gameClasses/Turret.js',
        './gameClasses/Bullet.js',
        './gameClasses/FuelRope.js',
        './gameClasses/Fuel.js',
        './gameClasses/Shield.js',
        './gameClasses/ThrustParticle.js',
        './gameClasses/ExplosionParticle.js',
        './gameClasses/LandingPad.js',
        './gameClasses/Wall.js',
        './gameClasses/ClientCountDown.js',
        './gameClasses/ClientScore.js',
        /* Standard game scripts */
        './client.js',
        './index.js'
    ]
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = igeClientConfig;
}