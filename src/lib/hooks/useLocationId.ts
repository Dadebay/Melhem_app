import authStore from '../store/authStore';

/**
 * The currently selected region id, used to scope customer browse queries
 * (drugs & pharmacies lists) to the chosen location. Undefined if unset.
 * Changing the region re-renders consumers, refetching their queries.
 */
const useLocationId = (): number | undefined =>
  authStore(state => state.location?.id);

export default useLocationId;
