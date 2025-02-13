import React, {Component} from 'react';
import {PanResponder, Animated, Dimensions, StyleSheet} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

export const DOWN_STATE = 0;
export const UP_STATE = 1;

export default class Animator extends Component {
    constructor(props) {
        super(props);

        this.position = new Animated.ValueXY(this.props.currentPosition);

        this._panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: this._handlePanResponderMove,
            onPanResponderRelease: this._handlePanResponderRelease
        });
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.drawerState !== this.props.drawerState) {
            if (nextProps.drawerState === 0) {
                this._transitionTo(this.props.downPosition, this.props.onCollapsed);
            }
            if (nextProps.drawerState === 1) {
                this._transitionTo(this.props.upPosition, this.props.onExpanded);
            }
        }
    }

    render() {
        return (
            <Animated.View
                style={[
                    this.props.style,
                    {...this.position.getLayout(), left: 0},
                    StyleSheet.flatten([
                        styles.animationContainer(
                            this.props.containerHeight,
                            this.props.backgroundColor
                        ),
                        styles.roundedEdges(this.props.roundedEdges),
                        styles.shadow(this.props.shadow)
                    ])
                ]}
                {...this._panResponder.panHandlers}
            >
                {this.props.children}
            </Animated.View>
        );
    }

    _handlePanResponderMove = (e, gesture) => {
        if (this._swipeInBounds(gesture)) {
            this.position.setValue({y: this.props.currentPosition.y + gesture.dy});
        } else {
            this.position.setValue({
                y: this.props.upPosition.y - this._calculateEase(gesture)
            });
        }
    };

    _handlePanResponderRelease = (e, gesture) => {
        if (
            gesture.dy > this.props.toggleThreshold &&
            this.props.currentPosition.y === this.props.upPosition.y
        ) {
            this._transitionTo(this.props.downPosition, this.props.onCollapsed);
            this.props.onDrawerStateSet(DOWN_STATE);
        } else if (
            gesture.dy < -this.props.toggleThreshold &&
            this.props.currentPosition === this.props.downPosition
        ) {
            this._transitionTo(this.props.upPosition, this.props.onExpanded);
            this.props.onDrawerStateSet(UP_STATE);
        } else {
            this._resetPosition();
        }
    };

    // returns true if the swipe is within the height of the drawer.
    _swipeInBounds(gesture) {
        return this.props.currentPosition.y + gesture.dy > this.props.upPosition.y;
    }

    _calculateEase(gesture) {
        return Math.min(Math.sqrt(gesture.dy * -1), Math.sqrt(SCREEN_HEIGHT));
    }

    _transitionTo(position, callback) {
        Animated.timing(this.position, {
            toValue: position
        }).start(() => callback());

        this.props.setCurrentPosition(position);
        callback();
    }

    _resetPosition() {
        Animated.timing(this.position, {
            toValue: this.props.currentPosition
        }).start();
    }
}

const styles = {
    animationContainer: (height, color) => ({
        width: SCREEN_WIDTH,
        position: 'absolute',
        height: height + Math.sqrt(SCREEN_HEIGHT),
        backgroundColor: color,
        zIndex: 100,
    }),
    roundedEdges: rounded => {
        return rounded == true && {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
        }
    },
    shadow: shadow => {
        return shadow == true && {
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.23,
            shadowRadius: 2.62,
            elevation: 4,
        }
    },
}