#ifndef DOORSTEP_H
#define DOORSTEP_H

#ifdef __cplusplus
extern "C" {
#endif

char *doorstep_queue(const char *json);
char *doorstep_conservation(const char *json);
void doorstep_string_free(char *ptr);

#ifdef __cplusplus
}
#endif

#endif
