import { DirectionsRenderer, GoogleMap, MarkerF } from '@react-google-maps/api';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { StopInterface, kigaliKimironkoBusStops } from '../../utils/routeStopsData';
import { setCurrentStop } from '../formMapData/GoogleMapDataSlice';
import Tax from '../../Assets/taxy.svg'
export interface MapProps {
    setMap: React.Dispatch<React.SetStateAction<google.maps.Map | null>>;
}

const containerStyle = {
    width: "100%",
    height: "100%",
    flexGrow: "1"
}

const GoogleMapComponent = (props: MapProps) => {
    const { setMap } = props;
    const { googleDirectionServiceResults, isDriving, driverSpeed, totalDuration } = useSelector((state: RootState) => state.googleDirectionServicesReducers);
    const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | google.maps.LatLng>(kigaliKimironkoBusStops[0].position);
    const [currentStation, setCurrentStation] = useState<StopInterface>(kigaliKimironkoBusStops[0]);
    const dispatch = useDispatch()

    const findClosestStop = (currentPos: google.maps.LatLngLiteral | google.maps.LatLng, stops: StopInterface[]): StopInterface | undefined => {
        let closestStop = stops[0];
        let minDistance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(currentPos),
            new google.maps.LatLng(stops[0].position)
        );

        for (const stop of stops) {
            const distance = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(currentPos),
                new google.maps.LatLng(stop.position)
            );
            if (distance < minDistance) {
                closestStop = stop;
                minDistance = distance;
            }
        }
        return closestStop;
    };

    const extractPathFromDirections = (directionsResult: google.maps.DirectionsResult): google.maps.LatLng[] => {
        let path: google.maps.LatLng[] = [];
        const route = directionsResult.routes[0];
        for (const leg of route.legs) {
            for (const step of leg.steps) {
                path = path.concat(step.path);
            }
        }
        return path;
    }

    // start moviingwith the vehicle
    useEffect(() => {
        if (driverSpeed && isDriving && googleDirectionServiceResults) {
            const paths = extractPathFromDirections(googleDirectionServiceResults);
            const distancePerStep = driverSpeed * (totalDuration / paths.length);// distance travelled in one step

            let step = 0;
            // const intervalTime = totalDuration / paths.length;
            const intervalTime = (paths.length / driverSpeed) * distancePerStep;

            const moveMarker = () => {
                if (step < paths.length) {
                    const newPos = paths[step];
                    setMarkerPosition(newPos);
                    const closestStop = findClosestStop(newPos, kigaliKimironkoBusStops);
                    if (closestStop) setCurrentStation(closestStop);
                    step++;
                } else {
                    clearInterval(intervalId);
                }
            };
            const intervalId = setInterval(moveMarker, intervalTime);
            return () => clearInterval(intervalId);
        }

    }, [isDriving, driverSpeed]);

    // google map  icons


    // watch next bus stop
    useEffect(() => {
        dispatch(setCurrentStop(currentStation));
    }, [currentStation]);

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={kigaliKimironkoBusStops[0].position}
            zoom={15}
            onLoad={(mapInstance: google.maps.Map) => setMap(mapInstance)}
        >
            <MarkerF
                position={googleDirectionServiceResults ? markerPosition : kigaliKimironkoBusStops[0].position}
                label={googleDirectionServiceResults && currentStation ? currentStation.name : ""}
                // icon={googleMapMarkerIcon}
                icon ={Tax}
            />
            {googleDirectionServiceResults && <DirectionsRenderer directions={googleDirectionServiceResults} />}
        </GoogleMap>
    )

}

export default GoogleMapComponent