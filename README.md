# Lookup: Adding Multi-Choice and Check Box Mappings
This plugin uses the plugin settings page to add multichoice and check box mappings to existing lookup fields. 
The config saves the associated lookup field, source app ID, source field, and mapped field for each row in the config settings page.

## To Do:
- The config page shouldn't allow multiple source fields to be mapped to the same mapped field.
- This plugin needs to handle a lookup trying to map a value that is not an option to the mapped field, either at the config page or when the lookup in a record actually tries copying the field values.
  - (In other words, the value of the source multi-choice/check box doesn't exist in the mapped multi-choice/check box.)
