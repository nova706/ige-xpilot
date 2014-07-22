/**
 * Listens for collisions between entities.
 */
var ContactListener = function () {
    ige.box2d.contactListener(
        // Listen for when contact's begin
        function (contact) {

            var entity1;
            var entity2;
            var shooter;

            var pointsForShootingShip = 100;
            var pointsForShootingTurret = 25;

            var maxWoundVelocity = 18;
            var minWoundVelocity = 10;
            var landVelocity = 2;

            // A ship collided with another entity
            if (contact.igeEitherCategory('ship')) {
                entity1 = contact.igeEntityByCategory('ship');
                entity2 = contact.igeOtherEntity(entity1);

                // If the player ship touches a landing pad, check velocity and angle
                var degrees = Math.degrees(entity1._rotate.z),
                    wound = Math.round(degrees / 360);

                if (wound > 0) {
                    degrees -= (360 * wound);
                }

                if (wound < 0) {
                    degrees -= (360 * wound);
                }

                var velocity = Math.abs(contact.m_fixtureA.m_body.m_linearVelocity.x) + Math.abs(contact.m_fixtureA.m_body.m_linearVelocity.y);
                var contactRight = contact.m_manifold.m_localPlaneNormal.x === -1;
                var contactLeft = contact.m_manifold.m_localPlaneNormal.x === 1;
                var contactTop = contact.m_manifold.m_localPlaneNormal.y === 1;
                var contactBottom = contact.m_manifold.m_localPlaneNormal.y === -1;

                switch (entity2.category()) {

                // Two ships collided
                case 'ship':
                    if (!entity1.$hasShield) {
                        entity1.$crash();
                    }
                    if (!entity2.$hasShield) {
                        entity2.$crash();
                    }
                    break;

                // A bullet hit a ship
                case 'bullet':
                    if (entity1._hasShield) {

                        // Ignore the contact if the ship has a shield
                        contact.SetEnabled(false);
                    } else {
                        shooter = entity2.$shooter;
                        if (shooter && shooter !== entity1 && shooter.category() === 'ship') {
                            shooter.$adjustScore(pointsForShootingShip);
                        }
                        entity1.$crash();
                    }
                    break;

                // The ship collided with a box wall or a fuel cell
                case 'wall_box':
                    if (velocity > maxWoundVelocity
                            || (velocity > minWoundVelocity && contactBottom && (degrees > 45 || degrees < -45))
                            || (velocity > minWoundVelocity && contactTop && (degrees > -135 || degrees < -225) && (degrees > 225 || degrees < 135))
                            || (velocity > minWoundVelocity && contactLeft && (degrees > 135 || degrees < 45))
                            || (velocity > minWoundVelocity && contactRight && (degrees > -45 || degrees < -135))) {
                        entity1.$crash();
                    }
                    break;

                case 'wall_br':
                    if (velocity > maxWoundVelocity || (velocity > minWoundVelocity && (degrees > 0 || degrees < -90))) {
                        entity1.$crash();
                    }
                    break;

                case 'wall_bl':
                    if (velocity > maxWoundVelocity || (velocity > minWoundVelocity && (degrees > 90 || degrees < 0))) {
                        entity1.$crash();
                    }
                    break;

                case 'wall_tl':
                    if (velocity > maxWoundVelocity || (velocity > minWoundVelocity && (degrees > 180 || degrees < 90))) {
                        entity1.$crash();
                    }
                    break;

                case 'wall_tr':
                    if (velocity > maxWoundVelocity || (velocity > minWoundVelocity && (degrees > -90 || degrees < -180))) {
                        entity1.$crash();
                    }
                    break;

                // The ship has collided with a landing pad
                case 'landingPad':
                    if (velocity > maxWoundVelocity || (velocity > minWoundVelocity && (degrees > 45 || degrees < -45))) {
                        entity1.$crash();
                    } else if (velocity <= landVelocity && (degrees < 45 || degrees > -45)) {
                        entity1.$land(entity2);
                    }
                    break;

                // The ship has collided with a fuel cell
                case 'fuel':
                    if (velocity > maxWoundVelocity
                            || (velocity > minWoundVelocity && contactBottom && (degrees > 45 || degrees < -45))
                            || (velocity > minWoundVelocity && contactTop && (degrees > -135 || degrees < -225) && (degrees > 225 || degrees < 135))
                            || (velocity > minWoundVelocity && contactLeft && (degrees > 135 || degrees < 45))
                            || (velocity > minWoundVelocity && contactRight && (degrees > -45 || degrees < -135))) {
                        entity1.$crash();
                    } else {
                        entity1.$startFueling(entity2);
                    }
                    break;
                }
            }

            if (contact.igeEitherCategory('turret')) {
                entity1 = contact.igeEntityByCategory('turret');
                entity2 = contact.igeOtherEntity(entity1);

                switch (entity2.category()) {

                // A ship is in range of or ran into the turret
                case 'ship':
                    if (contact.m_fixtureA.IsSensor() || contact.m_fixtureB.IsSensor()) {

                        // Ship in range of turret
                        entity1.$startShooting();
                    } else {

                        // The ship and turret collided
                        entity2.$crash();
                        entity1.$kill();
                    }
                    break;

                // A bullet hit the turret
                case 'bullet':
                    entity1.$kill();
                    shooter = entity2.$shooter;
                    if (shooter && shooter.category() === 'ship') {
                        shooter.$adjustScore(pointsForShootingTurret);
                    }
                    break;
                }

            }

            // If a bullet hits anything, destroy it.
            if (contact.igeEitherCategory('bullet')) {
                contact.igeEntityByCategory('bullet').destroy();
            }
        },

        // Listen for when contact's end
        function (contact) {
            if (contact.igeEitherCategory('fuel') && contact.igeEitherCategory('ship')) {
                if (contact.m_fixtureA.IsSensor() || contact.m_fixtureB.IsSensor()) {
                    // The ship's fuel sensor has disconnected
                    contact.igeEntityByCategory('ship').$stopFueling();
                }
            }

            if (contact.igeEitherCategory('turret')) {
                if (contact.m_fixtureA.IsSensor() || contact.m_fixtureB.IsSensor()) {
                    // The ship is out of range of the turret's sensor
                    contact.igeEntityByCategory('turret').$stopShooting();
                }
            }
        }
    );
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = ContactListener;
}