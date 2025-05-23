import { StyleSheet } from 'react-native';
import { hp, wp } from '../../helpers/common';

// Create a function that takes theme as a parameter
export const createSharedStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: wp(4),
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: hp(2),
      marginHorizontal: wp(4),
      marginTop: hp(2),
      backgroundColor: theme.colors.card,
    },
    title: {
      color: theme.colors.text,
      fontSize: hp(2.7),
      fontWeight: 'bold',
    },
    sectionTitle: {
      fontSize: hp(2.2),
      fontWeight: 'bold',
      marginVertical: hp(2),
      color: theme.colors.text,
    },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(1),
      gap: wp(2),
    },
    groupName: {
      fontSize: hp(2),
      color: theme.colors.textLight,
      fontWeight: '500',
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: hp(2),
      marginBottom: hp(1),
      shadowColor: theme.colors.text,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 2,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      padding: hp(1),
      fontSize: hp(2),
      color: theme.colors.text,
      backgroundColor: theme.colors.inputBackground,
    },
    button: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: wp(4),
      paddingVertical: hp(1),
      borderRadius: 16,
    },
    buttonText: {
      color: theme.colors.text,
      fontSize: hp(1.8),
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      padding: hp(4),
    },
    emptyText: {
      fontSize: hp(2),
      color: theme.colors.textLight,
      marginBottom: hp(2),
    },
  });
