export function clearUserSession() {
  localStorage.removeItem('resavvy_token');
  localStorage.removeItem('resavvy_user');
  localStorage.removeItem('resavvy_library');
  localStorage.removeItem('resavvy_player_state');
}
